package ci

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/sourcegraph/log"
	"gopkg.in/yaml.v2"

	bk "github.com/sourcegraph/sourcegraph/enterprise/dev/ci/internal/buildkite"
	"github.com/sourcegraph/sourcegraph/enterprise/dev/ci/internal/ci/operations"
	"github.com/sourcegraph/sourcegraph/internal/lazyregexp"
)

const wolfiImageDir = "wolfi-images"
const wolfiPackageDir = "wolfi-packages"

var baseImageRegex = lazyregexp.New(`wolfi-images\/([\w-]+)[.]yaml`)
var packageRegex = lazyregexp.New(`wolfi-packages\/([\w-]+)[.]yaml`)

// WolfiPackagesOperations rebuilds any packages whose configurations have changed
func WolfiPackagesOperations(changedFiles []string) (*operations.Set, int, []string) {
	// TODO: Should we require the image name, or the full path to the yaml file?
	ops := operations.NewNamedSet("Dependency packages")

	var changedPackages []string
	var buildStepKeys []string
	for _, c := range changedFiles {
		match := packageRegex.FindStringSubmatch(c)
		if len(match) == 2 {
			changedPackages = append(changedPackages, match[1])
			buildFunc, key := buildPackage(match[1])
			ops.Append(buildFunc)
			buildStepKeys = append(buildStepKeys, key)
		}
	}

	ops.Append(buildRepoIndex("main", buildStepKeys))

	return ops, len(buildStepKeys), changedPackages
}

// WolfiBaseImagesOperations rebuilds any base images whose configurations have changed
func WolfiBaseImagesOperations(changedFiles []string, tag string, packagesChanged bool) (*operations.Set, int) {
	// TODO: Should we require the image name, or the full path to the yaml file?
	ops := operations.NewNamedSet("Base image builds")
	logger := log.Scoped("gen-pipeline", "generates the pipeline for ci")

	var buildStepKeys []string
	for _, c := range changedFiles {
		match := baseImageRegex.FindStringSubmatch(c)
		if len(match) == 2 {
			buildFunc, key := buildWolfiBaseImage(match[1], tag, packagesChanged)
			ops.Append(buildFunc)
			buildStepKeys = append(buildStepKeys, key)
		} else {
			logger.Fatal(fmt.Sprintf("Unable to extract base image name from '%s', matches were %+v\n", c, match))
		}
	}

	ops.Append(allBaseImagesBuilt(buildStepKeys))

	return ops, len(buildStepKeys)
}

// Dependency tree between steps:
// (buildPackage[1], buildPackage[2], ...) <-- buildRepoIndex <-- (buildWolfi[1], buildWolfi[2], ...)

func buildPackage(target string) (func(*bk.Pipeline), string) {
	stepKey := sanitizeStepKey(fmt.Sprintf("package-dependency-%s", target))

	return func(pipeline *bk.Pipeline) {
		pipeline.AddStep(fmt.Sprintf(":package: Package dependency '%s'", target),
			bk.Cmd(fmt.Sprintf("./enterprise/dev/ci/scripts/wolfi/build-package.sh %s", target)),
			// We want to run on the bazel queue, so we have a pretty minimal agent.
			bk.Agent("queue", "bazel"),
			bk.Key(stepKey),
		)
	}, stepKey
}

func buildRepoIndex(branch string, packageKeys []string) func(*bk.Pipeline) {
	return func(pipeline *bk.Pipeline) {
		pipeline.AddStep(fmt.Sprintf(":card_index_dividers: Build and sign repository index for branch '%s'", branch),
			bk.Cmd(fmt.Sprintf("./enterprise/dev/ci/scripts/wolfi/build-repo-index.sh %s", branch)),
			// We want to run on the bazel queue, so we have a pretty minimal agent.
			bk.Agent("queue", "bazel"),
			// Depend on all previous package building steps
			bk.DependsOn(packageKeys...),
			bk.Key("buildRepoIndex"),
		)
	}
}

func buildWolfiBaseImage(target string, tag string, dependOnPackages bool) (func(*bk.Pipeline), string) {
	stepKey := sanitizeStepKey(fmt.Sprintf("build-base-image-%s", target))

	return func(pipeline *bk.Pipeline) {

		opts := []bk.StepOpt{
			bk.Cmd(fmt.Sprintf("./enterprise/dev/ci/scripts/wolfi/build-base-image.sh %s %s", target, tag)),
			// We want to run on the bazel queue, so we have a pretty minimal agent.
			bk.Agent("queue", "bazel"),
			bk.Env("DOCKER_BAZEL", "true"),
			bk.Key(stepKey),
		}
		// If packages have changed, wait for repo to be re-indexed as base images may depend on new packages
		if dependOnPackages {
			opts = append(opts, bk.DependsOn("buildRepoIndex"))
		}

		pipeline.AddStep(
			fmt.Sprintf(":octopus: Build Wolfi base image '%s'", target),
			opts...,
		)
	}, stepKey
}

// No-op to ensure all base images are updated before building full images
func allBaseImagesBuilt(baseImageKeys []string) func(*bk.Pipeline) {
	return func(pipeline *bk.Pipeline) {
		pipeline.AddStep(":octopus: All base images built",
			bk.Cmd("echo 'All base images built'"),
			// We want to run on the bazel queue, so we have a pretty minimal agent.
			bk.Agent("queue", "bazel"),
			// Depend on all previous package building steps
			bk.DependsOn(baseImageKeys...),
			bk.Key("buildAllBaseImages"),
		)
	}
}

var reStepKeySanitizer = lazyregexp.New(`[^a-zA-Z0-9_-]+`)

// sanitizeStepKey sanitizes BuildKite StepKeys by removing any invalid characters
func sanitizeStepKey(key string) string {
	return reStepKeySanitizer.ReplaceAllString(key, "")
}

// GetDependenciesOfPackages takes a list of packages and returns the set of base images that depend on these packages
func GetDependenciesOfPackages(packageNames []string, repo string) (images []string, err error) {
	packagesByImage, err := GetAllImageDependencies()
	if err != nil {
		return nil, err
	}

	// Create a list of images that depend on packageNames
	for _, packageName := range packageNames {
		i := GetDependenciesOfPackage(packagesByImage, packageName, repo)
		images = append(images, i...)

		fmt.Printf("Base images which depend on package %s: %v\n", packageName, i)
	}

	return
}

// GetDependenciesOfPackage returns the list of base images that depend on the given package
func GetDependenciesOfPackage(packagesByImage map[string][]string, packageName string, repo string) (images []string) {
	// Use a regex to catch cases like the `jaeger` package which builds `jaeger-agent` and `jaeger-all-in-one`
	var packageNameRegex = lazyregexp.New(fmt.Sprintf(`^%s(?:-[a-z0-9-]+)?$`, packageName))
	if repo != "" {
		packageNameRegex = lazyregexp.New(fmt.Sprintf(`^%s(?:-[a-z0-9-]+)?@%s`, packageName, repo))
	}

	for image, packages := range packagesByImage {
		for _, p := range packages {
			match := packageNameRegex.FindStringSubmatch(p)
			if len(match) > 0 {
				images = append(images, image)
			}
		}
	}

	// Dedupe image names
	unique := make(map[string]bool)
	var dedup []string
	for _, image := range images {
		if !unique[image] {
			unique[image] = true
			dedup = append(dedup, image)
		}
	}
	sort.Strings(dedup)
	images = dedup

	return
}

// GetAllImageDependencies returns a map of base images to the list of packages they depend upon
func GetAllImageDependencies() (packagesByImage map[string][]string, err error) {
	packagesByImage = make(map[string][]string)

	files, err := os.ReadDir(wolfiImageDir)
	if err != nil {
		return nil, err
	}

	for _, f := range files {
		if !strings.HasSuffix(f.Name(), ".yaml") {
			continue
		}

		filename := filepath.Join(wolfiImageDir, f.Name())
		imageName := strings.Replace(f.Name(), ".yaml", "", 1)

		packages, err := getPackagesFromBaseImageConfig(filename)
		if err != nil {
			return nil, err
		}

		packagesByImage[imageName] = packages
	}

	return
}

// BaseImageConfig follows a subset of the structure of a Wolfi base image manifests
type BaseImageConfig struct {
	Contents struct {
		Packages []string `yaml:"packages"`
	} `yaml:"contents"`
}

// getPackagesFromBaseImageConfig reads a base image config file and extracts the list of packages it depends on
func getPackagesFromBaseImageConfig(configFile string) ([]string, error) {
	var config BaseImageConfig

	yamlFile, err := ioutil.ReadFile(configFile)
	if err != nil {
		return nil, err
	}

	err = yaml.Unmarshal(yamlFile, &config)
	if err != nil {
		return nil, err
	}

	return config.Contents.Packages, nil
}
