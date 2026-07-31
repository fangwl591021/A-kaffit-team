import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolvePhoneBirthdayMember } from '../src/member-repository.js';

class ReadOnlyAuthDb {
  constructor(firstValue=null){this.firstValue=firstValue;this.mutated=false;}
  prepare(){return {bind:()=>({first:async()=>this.firstValue,run:async()=>{this.mutated=true;throw new Error('unexpected mutation')}})}};
}

test('login intent never creates a new member when no account exists', async()=>{
  const db=new ReadOnlyAuthDb(null);
  await assert.rejects(()=>resolvePhoneBirthdayMember(db,'0927136847','591021','','login'),/查無會員資料/);
  assert.equal(db.mutated,false);
});

test('register intent refuses an existing phone-birthday identity', async()=>{
  const db=new ReadOnlyAuthDb({user_id:'usr_existing'});
  await assert.rejects(()=>resolvePhoneBirthdayMember(db,'0927136847','591021','','register'),/已註冊.*會員登入/);
  assert.equal(db.mutated,false);
});

test('entry page clearly separates member login from new registration',()=>{
  const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../public/akaffit.css',import.meta.url),'utf8');
  const worker=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
  assert.match(app,/會員登入或註冊/);
  assert.match(app,/data-phone-auth-mode="login">會員登入/);
  assert.match(app,/data-phone-auth-mode="register">新會員註冊/);
  assert.match(app,/intent:phoneAuthMode/);
  assert.match(css,/\.ak-auth-tabs/);
  assert.match(worker,/\['login','register'\]\.includes\(body\.intent\)/);
});