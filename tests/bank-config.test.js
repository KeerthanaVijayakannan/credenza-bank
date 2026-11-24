import test from 'node:test';
import assert from 'node:assert/strict';
import bank from '../src/bank-config.js';

test('Credenza bank identity is aligned with its assigned bank project', () => {
  assert.equal(bank.id, 'P647');
  assert.equal(bank.name, 'Credenza Bank');
  assert.equal(bank.ifsc, 'KEER0P6L3VX');
  assert.equal(bank.firebaseProjectId, 'credenza-bank');
  assert.equal(bank.firestoreLocation, 'asia-south1');
  assert.equal(bank.githubOwner, 'keerthanavijayakannan');
  assert.equal(bank.githubRepo, 'credenza-bank');
});
