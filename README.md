# hermes-compiler

Provides high-level API to work with Hermes bytecode compiler through `emhermesc`.

## Usage
```ts
typeof emhermesc.VERSION; // "number"

const { bytecode } = emhermesc.compile("let x = 1; x++;", { sourceURL: "wintry.js" });
emhermesc.validateBytecodeModule(bytecode, 0);

console.log("Generated bytecode!", bytecode);
```