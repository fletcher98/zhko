# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: dictionary.proto
# Protobuf Python Version: 4.25.1
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x10\x64ictionary.proto\"\xf4\x01\n\x05\x45ntry\x12\x13\n\x0btraditional\x18\x01 \x01(\t\x12\x12\n\nsimplified\x18\x02 \x01(\t\x12\x0e\n\x06pinyin\x18\x03 \x01(\t\x12\x0c\n\x04tags\x18\x05 \x03(\t\x12\x1a\n\x08\x65xamples\x18\x06 \x03(\x0b\x32\x08.Example\x12\x12\n\npercentile\x18\x07 \x01(\x05\x12\x10\n\x08\x63ontains\x18\x08 \x03(\t\x12\x0e\n\x06partof\x18\t \x03(\t\x12\x0f\n\x07related\x18\n \x03(\t\x12\x1f\n\rexamples_full\x18\x0c \x03(\x0b\x32\x08.Example\x12 \n\x0b\x64\x65\x66initions\x18\r \x03(\x0b\x32\x0b.Definition\"%\n\nDictionary\x12\x17\n\x07\x65ntries\x18\x01 \x03(\x0b\x32\x06.Entry\"D\n\tCharacter\x12\x13\n\x0btraditional\x18\x01 \x01(\t\x12\x12\n\nsimplified\x18\x02 \x01(\t\x12\x0e\n\x06pinyin\x18\x03 \x01(\t\";\n\nDefinition\x12\x12\n\ndefinition\x18\x01 \x01(\t\x12\x19\n\x07\x65xample\x18\x02 \x01(\x0b\x32\x08.Example\">\n\x07\x45xample\x12\x0f\n\x07\x65xample\x18\x01 \x01(\t\x12\x0f\n\x07\x65nglish\x18\x02 \x01(\t\x12\x11\n\thighlight\x18\x03 \x01(\tB\x0fZ\r./server/main')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'dictionary_pb2', _globals)
if _descriptor._USE_C_DESCRIPTORS == False:
  _globals['DESCRIPTOR']._options = None
  _globals['DESCRIPTOR']._serialized_options = b'Z\r./server/main'
  _globals['_ENTRY']._serialized_start=21
  _globals['_ENTRY']._serialized_end=265
  _globals['_DICTIONARY']._serialized_start=267
  _globals['_DICTIONARY']._serialized_end=304
  _globals['_CHARACTER']._serialized_start=306
  _globals['_CHARACTER']._serialized_end=374
  _globals['_DEFINITION']._serialized_start=376
  _globals['_DEFINITION']._serialized_end=435
  _globals['_EXAMPLE']._serialized_start=437
  _globals['_EXAMPLE']._serialized_end=499
# @@protoc_insertion_point(module_scope)
