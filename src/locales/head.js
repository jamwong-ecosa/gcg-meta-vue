// <title> and <meta name="description"> per route name, set by useHeadMeta.
// Keep titles under ~60 characters and descriptions under ~160 (~80 for Chinese)
export default {
  en: {
    site: 'GCG Decks Analysis',
    imageAlt: 'GCG Decks Analysis: Gundam Card Game tournament meta, tier list from S to D',
    titleFormat: '{page} · GCG Decks Analysis',
    home: {
      title: 'GCG Decks Analysis · Gundam Card Game Tournament Meta',
      description:
        'Gundam Card Game tournament meta: which decks are winning, the cards they run and how the meta shifts each series, built from official results.',
    },
    tier: {
      title: 'Archetype Tier List',
      description:
        'Gundam Card Game archetype tier list, ranked S to D by how often each deck places in tournaments and how often those placements turn into wins.',
    },
    'archetype-analysis': {
      title: 'Archetype Analysis',
      description:
        'Gundam Card Game archetype deep dive: record across series, staple and flex card choices, and the placed deck lists behind each archetype.',
    },
    meta: {
      title: 'Meta Overview',
      description:
        'Gundam Card Game meta overview: card usage, color and level/cost distributions, top cards, newcomers and how this series compares to the last.',
    },
  },
  'zh-HK': {
    site: 'GCG 卡組分析',
    imageAlt: 'GCG 卡組分析：高達卡牌遊戲賽事環境，牌型由 S 到 D 分級',
    titleFormat: '{page}｜GCG 卡組分析',
    home: {
      title: 'GCG 卡組分析｜高達卡牌遊戲賽事環境',
      description:
        '高達卡牌遊戲（GUNDAM CARD GAME）賽事環境分析：哪些卡組最常勝出、用甚麼卡，以及每個系列的環境變化，全部根據官方賽果整理。',
    },
    tier: {
      title: '牌型排行榜',
      description:
        '高達卡牌遊戲牌型排行榜：按各卡組的賽事入賞次數與奪冠表現，將牌型由 S 到 D 分級。',
    },
    'archetype-analysis': {
      title: '牌型分析',
      description:
        '高達卡牌遊戲牌型深入分析：歷代系列戰績、主力卡與彈性卡選擇，以及每個牌型的入賞卡組列表。',
    },
    meta: {
      title: '環境總覽',
      description:
        '高達卡牌遊戲環境總覽：卡牌使用率、顏色與等級／費用分佈、熱門卡牌、新登場卡牌，以及與上一系列的比較。',
    },
  },
}
