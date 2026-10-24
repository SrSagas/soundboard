import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAudioFile} from '../js/validation.js';
import {storageError} from '../js/storage.js';
test('arquivo de texto renomeado como áudio não alcança o decodificador',async()=>{
  let decoded=false;await assert.rejects(validateAudioFile(new Blob(['<script>alert(1)</script>'],{type:'audio/mpeg'}),()=>{decoded=true;}),/não corresponde/);assert.equal(decoded,false);
});
test('erros nativos do armazenamento são apresentados em português',()=>{
  const message=storageError(new DOMException('The database connection is closing','InvalidStateError'));
  assert.match(message,/armazenamento|navegador|recarregue/i);assert.doesNotMatch(message,/database|closing/);
});
