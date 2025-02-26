import { ComponentType } from 'react'

import { CiSettings, CiTextAlignLeft, CiWarning } from 'react-icons/ci'
import { FaCss3Alt, FaRust, FaSass, FaVuejs } from 'react-icons/fa'
import { GoDatabase, GoTerminal } from 'react-icons/go'
import { GrJava } from 'react-icons/gr'
import { PiFilePngLight } from 'react-icons/pi'
import {
    SiApachegroovy,
    SiAssemblyscript,
    SiC,
    SiClojure,
    SiCoffeescript,
    SiCplusplus,
    SiCsharp,
    SiDart,
    SiDocker,
    SiFortran,
    SiFsharp,
    SiGit,
    SiGo,
    SiGraphql,
    SiHaskell,
    SiHtml5,
    SiJavascript,
    SiJpeg,
    SiJulia,
    SiKotlin,
    SiLua,
    SiMarkdown,
    SiNixos,
    SiNpm,
    SiOcaml,
    SiPerl,
    SiPhp,
    SiPython,
    SiR,
    SiReact,
    SiRuby,
    SiRust,
    SiScala,
    SiSvelte,
    SiSvg,
    SiSwift,
    SiTypescript,
    SiVisualbasic,
    SiZig,
} from 'react-icons/si'
import { VscJson } from 'react-icons/vsc'

import styles from './RepoRevisionSidebarFileTree.module.scss'

export enum FileExtension {
    ASSEMBLY = 'asm',
    BASH = 'sh',
    BASIC = 'vb',
    C = 'c',
    CLOJURE_CLJ = 'clj',
    CLOJURE_CLJS = 'cljs',
    CLOJURE_CLJR = 'cljr',
    CLOJURE_CLJC = 'cljc',
    CLOJURE_EDN = 'edn',
    COFFEE = 'coffee',
    CPP = 'cpp',
    CPP_CC = 'cc',
    CPP_CXX = 'cxx',
    CPP_H = 'h',
    CPP_HPP = 'hpp',
    CPP_HXX = 'hxx',
    CSHARP = 'cs',
    CSS = 'css',
    DART = 'dart',
    DEFAULT = 'default',
    DOCKERFILE = 'Dockerfile',
    DOCKERIGNORE = 'dockerignore',
    FORTRAN_F = 'f',
    FORTRAN_FOR = 'for',
    FORTRAN_FTN = 'ftn',
    FSHARP = 'fs',
    FSI = 'fsi',
    FSX = 'fsx',
    GITIGNORE = 'gitignore',
    GITATTRIBUTES = 'gitattributes',
    GO = 'go',
    GOMOD = 'mod',
    GOSUM = 'sum',
    GRAPHQL = 'graphql',
    GROOVY = 'groovy',
    HASKELL = 'hs',
    HTML = 'html',
    JAVA = 'java',
    JAVASCRIPT = 'js',
    JPG = 'jpg',
    JPEG = 'jpeg',
    JSON = 'json',
    JSX = 'jsx',
    JULIA = 'jl',
    KOTLIN = 'kt',
    LOCKFILE = 'lock',
    LUA = 'lua',
    MARKDOWN = 'md',
    NCL = 'ncl',
    NIX = 'nix',
    NPM = 'npmrc',
    OCAML = 'ml',
    PHP = 'php',
    PERL = 'pl',
    PERL_PM = 'pm',
    PNG = 'png',
    POWERSHELL_PS1 = 'ps1',
    POWERSHELL_PSM1 = 'psm1',
    PYTHON = 'py',
    R = 'r',
    RUBY = 'rb',
    RUST = 'rs',
    SCALA = 'scala',
    SASS = 'scss',
    SQL = 'sql',
    SVELTE = 'svelte',
    SVG = 'svg',
    SWIFT = 'swift',
    TEST = 'test',
    TYPESCRIPT = 'ts',
    TSX = 'tsx',
    TEXT = 'txt',
    TOML = 'toml',
    VUE = 'vue',
    YAML = 'yaml',
    YML = 'yml',
    ZIG = 'zig',
}

type CustomIcon = ComponentType<{ className?: string }>
interface IconInfo {
    icon: CustomIcon
    iconClass: string
}

interface FileInfo {
    extension: FileExtension
    isTest: boolean
}

export function getFileInfo(file: string, isDirectory: boolean): FileInfo {
    if (isDirectory) {
        return {
            extension: 'default' as FileExtension,
            isTest: false,
        }
    }

    const extension = file.split('.').at(-1)?.toLowerCase() as FileExtension
    const isValidExtension = Object.values(FileExtension).includes(extension)

    if (extension && isValidExtension) {
        return {
            extension,
            isTest: containsTest(file),
        }
    }

    return {
        extension: 'default' as FileExtension,
        isTest: false,
    }
}

export function containsTest(file: string): boolean {
    const f = file.split('.')
    // To account for other test file path structures
    // adjust this regular expression.
    const isTest = /^(test|spec|tests)(\b|_)|(\b|_)(test|spec|tests)$/

    for (const i of f) {
        if (i === 'test') {
            return true
        }
        if (isTest.test(i)) {
            return true
        }
    }
    return false
}
/*
 * We use the react-icons package instead of material design icons for two reasons:
 * 1) Many of mdi's programming language icons will be deprecated soon.
 * 2) They are missing quite a few icons that are needed when displaying file types.
 */
export const FILE_ICONS: Map<FileExtension, IconInfo> = new Map([
    [FileExtension.ASSEMBLY, { icon: SiAssemblyscript, iconClass: styles.defaultIcon }],
    [FileExtension.BASH, { icon: GoTerminal, iconClass: styles.defaultIcon }],
    [FileExtension.BASIC, { icon: SiVisualbasic, iconClass: styles.defaultIcon }],
    [FileExtension.C, { icon: SiC, iconClass: styles.blue }],
    [FileExtension.CLOJURE_CLJ, { icon: SiClojure, iconClass: styles.blue }],
    [FileExtension.CLOJURE_CLJC, { icon: SiClojure, iconClass: styles.blue }],
    [FileExtension.CLOJURE_CLJR, { icon: SiClojure, iconClass: styles.blue }],
    [FileExtension.CLOJURE_CLJS, { icon: SiClojure, iconClass: styles.blue }],
    [FileExtension.CLOJURE_EDN, { icon: SiClojure, iconClass: styles.blue }],
    [FileExtension.COFFEE, { icon: SiCoffeescript, iconClass: styles.defaultIcon }],
    [FileExtension.CPP, { icon: SiCplusplus, iconClass: styles.blue }],
    [FileExtension.CPP_CC, { icon: SiCplusplus, iconClass: styles.blue }],
    [FileExtension.CPP_CXX, { icon: SiCplusplus, iconClass: styles.blue }],
    [FileExtension.CPP_H, { icon: SiCplusplus, iconClass: styles.blue }],
    [FileExtension.CPP_HPP, { icon: SiCplusplus, iconClass: styles.blue }],
    [FileExtension.CPP_HXX, { icon: SiCplusplus, iconClass: styles.blue }],
    [FileExtension.CSHARP, { icon: SiCsharp, iconClass: styles.blue }],
    [FileExtension.CSS, { icon: FaCss3Alt, iconClass: styles.blue }],
    [FileExtension.DART, { icon: SiDart, iconClass: styles.blue }],
    [FileExtension.DEFAULT, { icon: CiWarning, iconClass: styles.red }],
    [FileExtension.DOCKERFILE, { icon: SiDocker, iconClass: styles.blue }],
    [FileExtension.DOCKERIGNORE, { icon: SiDocker, iconClass: styles.blue }],
    [FileExtension.FORTRAN_F, { icon: SiFortran, iconClass: styles.defaultIcon }],
    [FileExtension.FORTRAN_FOR, { icon: SiFortran, iconClass: styles.defaultIcon }],
    [FileExtension.FORTRAN_FTN, { icon: SiFortran, iconClass: styles.defaultIcon }],
    [FileExtension.FSHARP, { icon: SiFsharp, iconClass: styles.blue }],
    [FileExtension.FSI, { icon: SiFsharp, iconClass: styles.blue }],
    [FileExtension.FSX, { icon: SiFsharp, iconClass: styles.blue }],
    [FileExtension.GITIGNORE, { icon: SiGit, iconClass: styles.red }],
    [FileExtension.GITATTRIBUTES, { icon: SiGit, iconClass: styles.red }],
    [FileExtension.GO, { icon: SiGo, iconClass: styles.blue }],
    [FileExtension.GOMOD, { icon: SiGo, iconClass: styles.pink }],
    [FileExtension.GOSUM, { icon: SiGo, iconClass: styles.pink }],
    [FileExtension.GROOVY, { icon: SiApachegroovy, iconClass: styles.blue }],
    [FileExtension.GRAPHQL, { icon: SiGraphql, iconClass: styles.pink }],
    [FileExtension.HASKELL, { icon: SiHaskell, iconClass: styles.blue }],
    [FileExtension.HTML, { icon: SiHtml5, iconClass: styles.blue }],
    [FileExtension.JAVA, { icon: GrJava, iconClass: styles.defaultIcon }],
    [FileExtension.JAVASCRIPT, { icon: SiJavascript, iconClass: styles.yellow }],
    [FileExtension.JPG, { icon: SiJpeg, iconClass: styles.yellow }],
    [FileExtension.JPEG, { icon: SiJpeg, iconClass: styles.yellow }],
    [FileExtension.JSX, { icon: SiReact, iconClass: styles.yellow }],
    [FileExtension.JSON, { icon: VscJson, iconClass: styles.defaultIcon }],
    [FileExtension.JULIA, { icon: SiJulia, iconClass: styles.defaultIcon }],
    [FileExtension.KOTLIN, { icon: SiKotlin, iconClass: styles.green }],
    [FileExtension.LOCKFILE, { icon: VscJson, iconClass: styles.defaultIcon }],
    [FileExtension.LUA, { icon: SiLua, iconClass: styles.blue }],
    [FileExtension.MARKDOWN, { icon: SiMarkdown, iconClass: styles.blue }],
    [FileExtension.NCL, { icon: CiSettings, iconClass: styles.defaultIcon }],
    [FileExtension.NIX, { icon: SiNixos, iconClass: styles.gray }],
    [FileExtension.NPM, { icon: SiNpm, iconClass: styles.red }],
    [FileExtension.OCAML, { icon: SiOcaml, iconClass: styles.yellow }],
    [FileExtension.PHP, { icon: SiPhp, iconClass: styles.cyan }],
    [FileExtension.PERL, { icon: SiPerl, iconClass: styles.defaultIcon }],
    [FileExtension.PERL_PM, { icon: SiPerl, iconClass: styles.defaultIcon }],
    [FileExtension.PNG, { icon: PiFilePngLight, iconClass: styles.defaultIcon }],
    [FileExtension.POWERSHELL_PS1, { icon: GoTerminal, iconClass: styles.defaultIcon }],
    [FileExtension.POWERSHELL_PSM1, { icon: GoTerminal, iconClass: styles.defaultIcon }],
    [FileExtension.PYTHON, { icon: SiPython, iconClass: styles.blue }],
    [FileExtension.R, { icon: SiR, iconClass: styles.red }],
    // [FileExtension.R_CAP, { icon: SiR, iconClass: styles.red }],
    [FileExtension.RUBY, { icon: SiRuby, iconClass: styles.red }],
    [FileExtension.RUST, { icon: SiRust, iconClass: styles.defaultIcon }],
    [FileExtension.SCALA, { icon: SiScala, iconClass: styles.red }],
    [FileExtension.SASS, { icon: FaSass, iconClass: styles.pink }],
    [FileExtension.SQL, { icon: GoDatabase, iconClass: styles.blue }],
    [FileExtension.SVELTE, { icon: SiSvelte, iconClass: styles.red }],
    [FileExtension.SVG, { icon: SiSvg, iconClass: styles.blue }],
    [FileExtension.SWIFT, { icon: SiSwift, iconClass: styles.blue }],
    [FileExtension.TYPESCRIPT, { icon: SiTypescript, iconClass: styles.blue }],
    [FileExtension.TSX, { icon: SiReact, iconClass: styles.blue }],
    [FileExtension.TEXT, { icon: CiTextAlignLeft, iconClass: styles.defaultIcon }],
    [FileExtension.TOML, { icon: FaRust, iconClass: styles.defaultIcon }],
    [FileExtension.VUE, { icon: FaVuejs, iconClass: styles.green }],
    [FileExtension.YAML, { icon: CiSettings, iconClass: styles.defaultIcon }],
    [FileExtension.YML, { icon: CiSettings, iconClass: styles.defaultIcon }],
    [FileExtension.ZIG, { icon: SiZig, iconClass: styles.yellow }],
])
