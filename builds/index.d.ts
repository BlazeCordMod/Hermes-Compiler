/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @oncall react_native
 */
export type Options = {
    sourceURL: string;
    sourceMap?: string;
};
export type HermesCompilerResult = Readonly<{
    bytecode: Buffer;
}>;
export declare const align: (offset: number) => number;
export declare const compile: (source: string | Buffer, { sourceURL, sourceMap }: Options) => HermesCompilerResult;
export declare const validateBytecodeModule: (bytecode: Buffer, offset: number) => void;
export declare const getFileLength: (bytecode: Buffer, offset: number) => number;
export declare const VERSION: number;
