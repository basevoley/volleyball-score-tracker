import { getBestBadge, tokenize } from '../badgeUtils';

const url = (slug: string) => expect.stringContaining(`/images/teams/${slug}.`);

describe('tokenize', () => {
  test('strips accents, legal forms, sponsors and category letters', () => {
    expect(tokenize('CV Alcalá B')).toEqual(['alcala']);
    expect(tokenize('ASSA ABLOY SANSE')).toEqual(['sanse']);
    expect(tokenize('CDE Móstoles 2 de Mayo')).toEqual(['mostoles', '2', 'mayo']);
  });
});

describe('getBestBadge', () => {
  test('returns null without a name', () => {
    expect(getBestBadge(null)).toBeNull();
  });

  test('ignores accents and prefixes', () => {
    expect(getBestBadge('Alcala')).toBe('http://localhost:3005/images/teams/cv-alcala.jpg');
    expect(getBestBadge('CV Alcalá')).toBe('http://localhost:3005/images/teams/cv-alcala.jpg');
  });

  test('strips sponsors', () => {
    expect(getBestBadge('ASSA ABLOY SANSE')).toEqual(url('cv-sanse'));
  });

  test('tolerates typos', () => {
    expect(getBestBadge('CV Torrelodonez')).toEqual(url('cv-torrelodones'));
  });

  test('prefers the most specific badge', () => {
    expect(getBestBadge('CV Fuente el Saz Crows')).toEqual(url('cv-fuente-el-saz-crows'));
    expect(getBestBadge('CV Fuente el Saz')).toEqual(url('cv-fuente-el-saz'));
    expect(getBestBadge('San Agustin Guadalix')).toEqual(url('san-agustin-guadalix'));
    expect(getBestBadge('San Agustin')).toEqual(url('san-agustin'));
  });

  test('ignores category words and suffix letters', () => {
    expect(getBestBadge('CD Vallecas Femenino')).toEqual(url('cd-vallecas'));
    expect(getBestBadge('CV Pinto B')).toEqual(url('cv-pinto'));
  });

  test('is independent of word order and extra punctuation', () => {
    expect(getBestBadge('Sanse, C.V.')).toEqual(url('cv-sanse'));
  });

  test('handles FMV names with category, colour and level suffixes', () => {
    expect(getBestBadge('CV SANSE AMARILLO ALEVIN CIRCUITO MINIVOLEY FEMENINO')).toEqual(url('cv-sanse'));
    expect(getBestBadge('CDE PARLA VOLEY AZUL BENJAMIN FEMENINO')).toEqual(url('cde-parla-voley'));
    expect(getBestBadge('CLARET MADRID A PRE CADETE - AVA FEMENINO')).toEqual(url('sad-colegio-claret'));
    expect(getBestBadge('LEGANÉS AZUL ALEVIN CIRCUITO MINIVOLEY FEMENINO')).toEqual(url('cv-leganes'));
  });

  test('expands FMV abbreviations', () => {
    expect(getBestBadge('CUV ALCORCÓN AZUL')).toEqual(url('club-unificado-voleibol-alcorcon-cuva'));
    expect(getBestBadge('CHV1995 A')).toEqual(url('cde-chamartin-vergara-1995'));
    expect(getBestBadge('ARCANGEL INTR CAD B')).toEqual(url('arcangel-international'));
    expect(getBestBadge('CDB AVP ALEVIN ROTULARTE')).toEqual(url('cdb-avp-academia-voleibol-parla'));
    expect(getBestBadge('GDLR A')).toEqual(url('cdb-grupo-deportivo-las-rozas'));
    expect(getBestBadge('MBVA AMARILLO')).toEqual(url('madrid-beach-voley-academy'));
    expect(getBestBadge('MIRASUR CIRCUITO A')).toEqual(url('mirasur-school-pinto'));
  });

  test('ignores extra words in the team name when the badge is fully covered', () => {
    expect(getBestBadge('CV PINTO ESC PRINCIPES B')).toEqual(url('cv-pinto'));
    expect(getBestBadge('INTERVOLEY LOS ÁNGELES')).toEqual(url('cde-intervoley-fuenlabrada'));
  });

  test('resolves GSD and VP abbreviations', () => {
    expect(getBestBadge('GSD LAS SUERTES')).toEqual(url('cd-gredos-san-diego'));
    expect(getBestBadge('GSD ALCALA')).toEqual(url('cd-gredos-san-diego'));
    expect(getBestBadge('VP MADRID B NEGRO')).toEqual(url('cde-voley-playa-madrid'));
    expect(getBestBadge('VPMADRID')).toEqual(url('cde-voley-playa-madrid'));
  });

  test('maps club aliases to their badge', () => {
    expect(getBestBadge('CV BULLDOGS A A')).toEqual(url('cv-villanueva-del-pardillo'));
    expect(getBestBadge('CV BULLDOGS VALDEMORILLO D')).toEqual(url('cv-villanueva-del-pardillo'));
    expect(getBestBadge('MADRID CHAMBERÍ')).toEqual(url('cde-voleibol-madrid-ciudad'));
  });

  test('splits club names that FMV writes without a space', () => {
    expect(getBestBadge('SACOCHAMARTIN C')).toEqual(url('saco-chamartin'));
  });

  test('maps Saint Louis NUT / Morillon to Saint Louis des Francais', () => {
    expect(getBestBadge('SAINT LOUIS NUT MORILLON B')).toEqual(url('club-saint-louis-des-francais'));
    expect(getBestBadge('SAINT LOUIS NUT A')).toEqual(url('club-saint-louis-des-francais'));
  });

  test('does not map Liceo Sorolla Pozuelo to Mintonette CV Pozuelo', () => {
    expect(getBestBadge('LICEO SOROLLA POZUELO A')).toBeNull();
  });

  test('gives no badge to LMVP teams', () => {
    expect(getBestBadge('LMVP - CV SANSE')).toBeNull();
    expect(getBestBadge('LMVP VP MADRID')).toBeNull();
    expect(getBestBadge('LMVP - GDLR A')).toBeNull();
  });

  test('does not match unrelated clubs with similar words', () => {
    expect(getBestBadge('SANTA MARÍA DEL PILAR')).toBeNull();
  });

  test('returns null when nothing matches', () => {
    expect(getBestBadge('Equipo Inventado')).toBeNull();
  });
});
