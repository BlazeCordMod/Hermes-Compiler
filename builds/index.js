// @bun
// src/index.ts
var hermesc = import.meta.require("./emhermesc.js")({
  noInitialRun: true,
  noExitRuntime: true,
  print: () => {
  },
  printErr: () => {
  }
});
var compileToBytecode = hermesc.cwrap("hermesCompileToBytecode", "number", [
  "number",
  "number",
  "string",
  "number",
  "number"
]);
var getError = hermesc.cwrap("hermesCompileResult_getError", "string", [
  "number"
]);
var getBytecodeAddr = hermesc.cwrap("hermesCompileResult_getBytecodeAddr", "number", ["number"]);
var getBytecodeSize = hermesc.cwrap("hermesCompileResult_getBytecodeSize", "number", ["number"]);
var free = hermesc.cwrap("hermesCompileResult_free", "void", ["number"]);
var props = JSON.parse(hermesc.ccall("hermesGetProperties", "string", [], []));
function strdup(str) {
  var copy = Buffer.from(str, "utf8");
  var size = copy.length + 1;
  var address = hermesc._malloc(size);
  if (!address) {
    throw new Error("hermesc string allocation error");
  }
  hermesc.HEAP8.set(copy, address);
  hermesc.HEAP8[address + copy.length] = 0;
  return { ptr: address, size };
}
var align = (offset) => offset + props.BYTECODE_ALIGNMENT - 1 & ~(props.BYTECODE_ALIGNMENT - 1);
var compile = function(source, { sourceURL, sourceMap }) {
  const buffer = typeof source === "string" ? Buffer.from(source, "utf8") : source;
  const address = hermesc._malloc(buffer.length + 1);
  if (!address) {
    throw new Error("Hermesc is out of memory.");
  }
  try {
    hermesc.HEAP8.set(buffer, address);
    hermesc.HEAP8[address + buffer.length] = 0;
    const sourceMapNotNull = sourceMap ?? "";
    const mapOnHeap = strdup(sourceMapNotNull);
    let result;
    try {
      result = compileToBytecode(address, buffer.length + 1, sourceURL, mapOnHeap.ptr, mapOnHeap.size);
    } finally {
      hermesc._free(mapOnHeap.ptr);
    }
    try {
      const error = getError(result);
      if (error) {
        throw new Error(error);
      }
      const bufferFromHBC = Buffer.from(hermesc.HEAP8.buffer, getBytecodeAddr(result), getBytecodeSize(result));
      const bytecode = Buffer.alloc(align(bufferFromHBC.length));
      bufferFromHBC.copy(bytecode, 0);
      return {
        bytecode
      };
    } finally {
      free(result);
    }
  } finally {
    hermesc._free(address);
  }
};
var validateBytecodeModule = function(bytecode, offset) {
  if ((bytecode.byteOffset + offset) % props.BYTECODE_ALIGNMENT) {
    throw new Error("Bytecode is not aligned to " + props.BYTECODE_ALIGNMENT + ".");
  }
  const fileLength = bytecode.readUInt32LE(offset + props.LENGTH_OFFSET);
  if (bytecode.length - offset < props.HEADER_SIZE || bytecode.length - offset < fileLength) {
    throw new Error("Bytecode buffer is too small.");
  }
  if (bytecode.readUInt32LE(offset + 0) !== props.MAGIC[0] || bytecode.readUInt32LE(offset + 4) !== props.MAGIC[1]) {
    throw new Error("Bytecode buffer is missing magic value.");
  }
  const version = bytecode.readUInt32LE(offset + 8);
  if (version !== props.VERSION) {
    throw new Error("Bytecode version is " + version + " but " + props.VERSION + " is required.");
  }
};
var getFileLength = function(bytecode, offset) {
  return bytecode.readUInt32LE(offset + props.LENGTH_OFFSET);
};
var VERSION = props.VERSION;
export {
  validateBytecodeModule,
  getFileLength,
  compile,
  align,
  VERSION
};
