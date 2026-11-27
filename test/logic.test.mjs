// Tests de la logique pure : node test/logic.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const src = html.split('// <logic>')[1].split('// </logic>')[0];
const L = new Function(src + '; return {pts,isWild,makeDeck,checkMeld,orderMeld,solve,getSol,arrange,penalty,canGoOutWith,chooseDiscard,chooseDraw,solCache};')();
const C = (s, v, id = 0) => ({ id, s, v });
const J = id => ({ id, s: -1, v: 0 });
let n = 0; const ok = (name, fn) => { L.solCache.clear(); fn(); n++; console.log('ok -', name); };

ok('paquet : 2 x 58 = 116 cartes, 6 jokers, ids uniques', () => {
  const d = L.makeDeck(); assert.equal(d.length, 116);
  assert.equal(d.filter(c => c.s < 0).length, 6);
  assert.equal(new Set(d.map(c => c.id)).size, 116);
  assert.equal(d.filter(c => c.s === 2 && c.v === 13).length, 2);
});
ok('points : 3-10 faciaux, V11 D12 R13, joker 50, atout 20', () => {
  assert.equal(L.pts(C(1, 7), 3), 7); assert.equal(L.pts(C(1, 11), 3), 11); assert.equal(L.pts(C(1, 12), 3), 12);
  assert.equal(L.pts(C(1, 13), 3), 13); assert.equal(L.pts(J(1), 3), 50); assert.equal(L.pts(C(1, 3), 3), 20); assert.equal(L.pts(C(1, 13), 13), 20);
});
ok('suite simple 4-5-6-7 valide, 3 cartes minimum', () => {
  assert.ok(L.checkMeld([C(4, 4, 1), C(4, 5, 2), C(4, 6, 3)], 99));
  assert.equal(L.checkMeld([C(4, 4, 1), C(4, 5, 2)], 99), null);
});
ok('suite : couleurs mélangées ou trou refusés', () => {
  assert.equal(L.checkMeld([C(4, 4, 1), C(3, 5, 2), C(4, 6, 3)], 99), null);
  assert.equal(L.checkMeld([C(4, 4, 1), C(4, 5, 2), C(4, 7, 3)], 99), null);
});
ok('suite avec joker comblant un trou / prolongeant', () => {
  assert.ok(L.checkMeld([C(4, 4, 1), J(2), C(4, 6, 3)], 99));
  assert.ok(L.checkMeld([C(4, 12, 1), C(4, 13, 2), J(3)], 99)); // J,Q,K via joker en bas
  assert.ok(L.checkMeld([C(4, 3, 1), C(4, 4, 2), J(3), J(4)], 99));
});
ok('pas de bouclage roi-3', () => {
  assert.equal(L.checkMeld([C(4, 13, 1), C(4, 3, 2), C(4, 4, 3)], 99), null);
});
ok('famille de 3 valets (toutes couleurs) valide, doublon de couleur autorisé', () => {
  assert.ok(L.checkMeld([C(0, 11, 1), C(1, 11, 2), C(2, 11, 3)], 99));
  assert.ok(L.checkMeld([C(0, 11, 1), C(0, 11, 2), C(2, 11, 3)], 99));
});
ok('suite avec doublon de valeur refusée', () => {
  assert.equal(L.checkMeld([C(4, 5, 1), C(4, 5, 2), C(4, 6, 3), C(4, 7, 4)], 99), null);
});
ok('atout (valeur = atout de la manche) joue le rôle de joker', () => {
  assert.ok(L.checkMeld([C(4, 4, 1), C(0, 5, 2), C(4, 6, 3)], 5));      // le 5 d'étoile = atout
  assert.equal(L.checkMeld([C(4, 4, 1), C(0, 5, 2), C(4, 6, 3)], 9), null); // sinon non
});
ok('règlement : toute carte peut être remplacée -> 3 jokers/atouts seuls forment une combinaison', () => {
  assert.ok(L.checkMeld([J(1), J(2), J(3)], 5));
  assert.ok(L.checkMeld([J(1), C(0, 5, 2), C(1, 5, 3)], 5));
  assert.equal(L.penalty([J(11), J(12), C(2, 5, 13)], 5), 0);
});
ok('orderMeld indique la valeur des jokers', () => {
  const o = L.orderMeld([C(4, 4, 1), J(2), C(4, 6, 3)], 99);
  assert.deepEqual(o.map(x => x.c.v === 0 ? 'J' + x.as : x.c.v), [4, 'J5', 6]);
});
ok('exemple du règlement : manche 4, 3 de trèfle défaussé, 8-9-10 posé => pénalité 0', () => {
  const hand = [C(4, 8, 1), C(4, 9, 2), C(4, 10, 3), C(1, 6, 4), C(1, 6, 5), C(2, 6, 6)];
  // atout manche 4 = 6 : les 6 sont des atouts, donc jokers -> toute la main est posable
  assert.equal(L.penalty(hand, 6), 0);
});
ok('solveur : pénalité minimale avec cartes isolées', () => {
  const hand = [C(4, 4, 1), C(4, 5, 2), C(4, 6, 3), C(1, 13, 4), C(2, 9, 5)];
  assert.equal(L.penalty(hand, 99), 22);
});
ok('solveur : choisit la meilleure répartition (jokers sur les plus grosses cartes)', () => {
  // famille de rois (3) + suite 4-5-6 : un seul joker, mieux vaut compléter la famille de rois
  const hand = [C(0, 13, 1), C(1, 13, 2), J(3), C(4, 4, 4), C(4, 5, 5), C(4, 6, 6)];
  assert.equal(L.penalty(hand, 99), 0);
});
ok('solveur : un joker non posé coûte 50, un atout 20', () => {
  assert.equal(L.penalty([J(1), C(0, 3, 2), C(1, 8, 3)], 99), 50 + 3 + 8 - 0);
  assert.equal(L.penalty([C(1, 5, 1), C(0, 3, 2), C(1, 8, 3)], 5), 20 + 3 + 8);
});
ok('canGoOutWith : défausser le bon carte permet de poser', () => {
  const hand = [C(4, 4, 1), C(4, 5, 2), C(4, 6, 3), C(1, 13, 4)];
  assert.ok(L.canGoOutWith(hand, 4, 99)); assert.ok(!L.canGoOutWith(hand, 1, 99));
});
ok('main de 13 + 1 cartes résolue en temps raisonnable', () => {
  const deck = L.makeDeck(); const hand = deck.filter((c, i) => i % 8 === 0).slice(0, 14);
  const t = Date.now(); L.penalty(hand, 13); assert.ok(Date.now() - t < 1500, 'trop lent: ' + (Date.now() - t));
});
ok('IA : sort quand c\'est possible, ne défausse pas de joker en cours de manche', () => {
  const hand = [C(4, 4, 1), C(4, 5, 2), C(4, 6, 3), C(1, 13, 4)];
  assert.equal(L.chooseDiscard(hand, 99, false, 'hard').c.id, 4);
  const h2 = [C(4, 4, 1), C(1, 9, 2), C(2, 13, 3), J(4)];
  assert.ok(L.chooseDiscard(h2, 99, false, 'hard').c.s >= 0);
});
ok('IA : prend la défausse si elle améliore la main', () => {
  const hand = [C(4, 4, 1), C(4, 5, 2), C(1, 13, 3)];
  assert.equal(L.chooseDraw(hand, C(4, 6, 9), 99, false, 'hard'), 'disc');
  assert.equal(L.chooseDraw(hand, C(2, 13, 10), 99, false, 'hard'), 'pile');
});
console.log(`\n${n} tests passés`);
