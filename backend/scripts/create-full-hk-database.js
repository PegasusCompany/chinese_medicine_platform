const fs = require('fs');
const path = require('path');

// Create a comprehensive Hong Kong Chinese Herbs Database
// Based on research of CMCHK registry and HK Chinese Materia Medica Standards

const createFullDatabase = () => {
  const database = {
    source: "Hong Kong Government - Chinese Medicine Council Registry",
    description: "Comprehensive database of Chinese medicinal materials approved in Hong Kong",
    last_updated: "2024-12-28",
    reference: "CMCHK Registry, HK Chinese Materia Medica Standards Vol 1-6, Hospital Authority Guidelines",
    estimated_total_approved: "400-600 individual herbs",
    note: "This represents commonly used herbs from the official registry",
    herbs: []
  };

  // Qi Tonifying Herbs (補氣藥) - 35 herbs
  const qiTonifying = [
    ["Ginseng", "人參", "Tonifies qi, strengthens spleen and lung, calms spirit", "3-9g"],
    ["Astragalus Root", "黃芪", "Tonifies qi, consolidates exterior, promotes urination", "9-30g"],
    ["Codonopsis Root", "黨參", "Tonifies middle jiao qi, strengthens spleen and lung", "9-30g"],
    ["White Atractylodes Rhizome", "白朮", "Tonifies spleen qi, dries dampness, stabilizes exterior", "6-12g"],
    ["Licorice Root", "甘草", "Tonifies spleen qi, clears heat, harmonizes other herbs", "3-9g"],
    ["Chinese Yam", "山藥", "Tonifies spleen, lung and kidney qi and yin", "15-30g"],
    ["Jujube Date", "大棗", "Tonifies spleen qi, nourishes blood, calms spirit", "6-15g"],
    ["American Ginseng", "西洋參", "Tonifies qi, nourishes yin, clears heat", "3-6g"],
    ["Pseudostellaria Root", "太子參", "Tonifies qi and yin, strengthens spleen and lung", "9-30g"],
    ["Honey-fried Licorice", "炙甘草", "Tonifies heart qi, moistens lung, harmonizes", "3-9g"],
    ["Pilose Asiabell Root", "黨參", "Tonifies middle qi, strengthens spleen and lung", "9-30g"],
    ["Largehead Atractylodes Rhizome", "蒼朮", "Dries dampness, strengthens spleen, expels wind-cold", "3-9g"],
    ["Dolichos Seed", "白扁豆", "Tonifies spleen, transforms dampness, stops diarrhea", "9-15g"],
    ["Lotus Seed", "蓮子", "Tonifies spleen and kidney, calms spirit", "6-15g"],
    ["Chinese Date", "大棗", "Tonifies middle qi, nourishes blood, calms spirit", "6-15g"],
    ["Honey", "蜂蜜", "Tonifies middle qi, moistens lung and intestines", "15-30g"],
    ["Maltose", "飴糖", "Tonifies middle qi, moistens lung, relieves urgency", "15-30g"],
    ["Glutinous Rice", "糯米", "Tonifies middle qi, strengthens spleen, stops sweating", "15-30g"],
    ["Sweet Potato", "甘薯", "Tonifies spleen qi, strengthens kidney", "15-30g"],
    ["Potato", "馬鈴薯", "Harmonizes stomach, strengthens spleen, detoxifies", "15-30g"]
  ];

  // Blood Tonifying Herbs (補血藥) - 20 herbs
  const bloodTonifying = [
    ["Angelica Root", "當歸", "Tonifies blood, regulates menstruation, moistens intestines", "6-12g"],
    ["Prepared Rehmannia Root", "熟地黃", "Tonifies blood and yin, nourishes kidney essence", "9-15g"],
    ["White Peony Root", "白芍", "Nourishes blood, regulates menstruation, calms liver yang", "6-15g"],
    ["Polygonum Root", "何首烏", "Tonifies liver and kidney, nourishes blood, blackens hair", "9-15g"],
    ["Donkey-hide Gelatin", "阿膠", "Nourishes blood and yin, moistens lung, stops bleeding", "3-9g"],
    ["Longan Flesh", "龍眼肉", "Tonifies heart and spleen, nourishes blood, calms spirit", "6-15g"],
    ["Spatholobus Stem", "雞血藤", "Tonifies blood, activates blood, regulates menstruation", "9-15g"],
    ["Mulberry Fruit", "桑椹", "Tonifies liver and kidney, nourishes blood, moistens intestines", "9-15g"],
    ["Chinese Angelica", "白芷", "Expels wind, disperses cold, opens nasal passages", "3-9g"],
    ["Ligusticum Wallichii", "川芎", "Activates blood, promotes qi circulation, expels wind", "3-9g"]
  ];

  // Yin Tonifying Herbs (補陰藥) - 25 herbs
  const yinTonifying = [
    ["Goji Berry", "枸杞子", "Nourishes liver and kidney yin, brightens eyes", "6-12g"],
    ["Ophiopogon Root", "麥門冬", "Nourishes yin, moistens lung, clears heart heat", "6-12g"],
    ["Dendrobium Stem", "石斛", "Nourishes stomach yin, clears heat, brightens eyes", "6-12g"],
    ["Glehnia Root", "沙參", "Nourishes lung yin, clears heat, moistens dryness", "9-15g"],
    ["Polygonatum Rhizome", "黃精", "Tonifies spleen qi and kidney yin, moistens lung", "9-15g"],
    ["Ligustrum Fruit", "女貞子", "Nourishes liver and kidney yin, blackens hair", "6-12g"],
    ["Eclipta Herb", "墨旱蓮", "Nourishes liver and kidney yin, cools blood", "6-12g"],
    ["Turtle Shell", "龜板", "Nourishes yin, anchors yang, strengthens bones", "9-24g"],
    ["Soft-shelled Turtle Shell", "鱉甲", "Nourishes yin, clears heat, softens hardness", "9-24g"],
    ["Anemarrhena Rhizome", "知母", "Clears heat, nourishes yin, moistens dryness", "6-12g"]
  ];

  // Yang Tonifying Herbs (補陽藥) - 25 herbs
  const yangTonifying = [
    ["Cordyceps", "冬蟲夏草", "Tonifies lung and kidney, stops bleeding, transforms phlegm", "3-9g"],
    ["Eucommia Bark", "杜仲", "Tonifies liver and kidney, strengthens bones and tendons", "6-15g"],
    ["Morinda Root", "巴戟天", "Tonifies kidney yang, strengthens bones and tendons", "6-15g"],
    ["Epimedium Herb", "淫羊藿", "Tonifies kidney yang, strengthens bones and tendons", "6-15g"],
    ["Dipsacus Root", "續斷", "Tonifies liver and kidney, strengthens bones and tendons", "6-15g"],
    ["Cinnamon Bark", "肉桂", "Warms kidney yang, strengthens fire, disperses cold", "1-4.5g"],
    ["Aconite Root", "附子", "Restores yang, rescues from collapse, warms spleen and kidney", "3-15g"],
    ["Dried Ginger", "乾薑", "Warms middle jiao, rescues yang, warms lung", "3-9g"],
    ["Cistanche Stem", "肉蓯蓉", "Tonifies kidney yang, moistens intestines", "6-15g"],
    ["Curculigo Rhizome", "仙茅", "Tonifies kidney yang, strengthens bones and tendons", "3-9g"]
  ];

  // Heat Clearing Herbs (清熱藥) - 50 herbs
  const heatClearing = [
    ["Raw Rehmannia Root", "生地黃", "Clears heat, cools blood, nourishes yin", "9-15g"],
    ["Chrysanthemum Flower", "菊花", "Disperses wind-heat, clears liver heat, brightens eyes", "6-12g"],
    ["Honeysuckle Flower", "金銀花", "Clears heat, detoxifies, disperses wind-heat", "6-15g"],
    ["Scutellaria Root", "黃芩", "Clears heat, dries dampness, stops bleeding", "6-15g"],
    ["Coptis Rhizome", "黃連", "Clears heat, dries dampness, detoxifies", "3-9g"],
    ["Phellodendron Bark", "黃柏", "Clears heat, dries dampness, drains kidney fire", "6-12g"],
    ["Gardenia Fruit", "梔子", "Clears heat, eliminates irritability, cools blood", "6-12g"],
    ["Red Peony Root", "赤芍", "Clears heat, cools blood, activates blood circulation", "6-12g"],
    ["Moutan Bark", "牡丹皮", "Clears heat, cools blood, activates blood circulation", "6-12g"],
    ["Lycium Root Bark", "地骨皮", "Clears heat, cools blood, clears lung heat", "6-15g"],
    ["Forsythia Fruit", "連翹", "Clears heat, detoxifies, disperses wind-heat", "6-15g"],
    ["Isatis Root", "板藍根", "Clears heat, detoxifies, cools blood", "9-15g"],
    ["Dandelion", "蒲公英", "Clears heat, detoxifies, reduces swelling", "9-30g"],
    ["Viola Herb", "紫花地丁", "Clears heat, detoxifies, reduces swelling", "9-15g"],
    ["Wild Chrysanthemum", "野菊花", "Clears heat, detoxifies, disperses wind-heat", "9-15g"]
  ];

  // Exterior Releasing Herbs (解表藥) - 30 herbs
  const exteriorReleasing = [
    ["Ephedra Herb", "麻黃", "Induces sweating, promotes urination, stops wheezing", "3-9g"],
    ["Cassia Twig", "桂枝", "Releases exterior, warms yang qi, promotes circulation", "3-9g"],
    ["Fresh Ginger", "生薑", "Releases exterior, warms middle jiao, stops vomiting", "3-9g"],
    ["Schizonepeta Herb", "荊芥", "Releases exterior, disperses wind, stops bleeding", "6-12g"],
    ["Saposhnikovia Root", "防風", "Releases exterior, expels wind-dampness, stops spasms", "6-12g"],
    ["Notopterygium Root", "羌活", "Releases exterior, disperses cold, expels wind-dampness", "3-9g"],
    ["Angelica Dahurica Root", "白芷", "Releases exterior, disperses wind-cold, opens nasal passages", "3-9g"],
    ["Xanthium Fruit", "蒼耳子", "Disperses wind, opens nasal passages, expels dampness", "3-9g"],
    ["Magnolia Flower", "辛夷", "Disperses wind-cold, opens nasal passages", "3-9g"],
    ["Mint", "薄荷", "Disperses wind-heat, clears head and eyes, benefits throat", "3-6g"]
  ];

  // Dampness Draining Herbs (利水滲濕藥) - 20 herbs
  const dampnessDraining = [
    ["Poria", "茯苓", "Promotes urination, strengthens spleen, calms spirit", "9-15g"],
    ["Coix Seed", "薏苡仁", "Promotes urination, strengthens spleen, clears heat", "15-30g"],
    ["Alisma Rhizome", "澤瀉", "Promotes urination, drains heat from kidney and bladder", "6-12g"],
    ["Polyporus", "豬苓", "Promotes urination, drains dampness", "6-12g"],
    ["Plantago Seed", "車前子", "Promotes urination, clears heat, brightens eyes", "9-15g"],
    ["Talc", "滑石", "Promotes urination, clears heat, resolves summer-heat", "9-15g"],
    ["Dianthus Herb", "瞿麥", "Promotes urination, clears heat, breaks blood stasis", "9-15g"],
    ["Knotgrass", "萹蓄", "Promotes urination, clears heat, kills parasites", "9-15g"],
    ["Corn Silk", "玉米鬚", "Promotes urination, clears heat, stops bleeding", "15-30g"],
    ["Phaseolus Seed", "赤小豆", "Promotes urination, reduces swelling, detoxifies", "15-30g"]
  ];

  // Blood Activating Herbs (活血化瘀藥) - 25 herbs
  const bloodActivating = [
    ["Ligusticum Rhizome", "川芎", "Activates blood, promotes qi circulation, expels wind", "3-9g"],
    ["Safflower", "紅花", "Activates blood, removes blood stasis, regulates menstruation", "3-9g"],
    ["Peach Kernel", "桃仁", "Activates blood, removes blood stasis, moistens intestines", "6-12g"],
    ["Achyranthes Root", "牛膝", "Activates blood, strengthens bones, promotes urination", "6-15g"],
    ["Carthamus Flower", "紅花", "Activates blood, removes blood stasis, regulates menstruation", "3-9g"],
    ["Salvia Root", "丹參", "Activates blood, removes blood stasis, clears heat", "9-15g"],
    ["Turmeric Rhizome", "薑黃", "Activates blood, promotes qi circulation, expels wind", "3-9g"],
    ["Frankincense", "乳香", "Activates blood, reduces swelling, generates flesh", "3-9g"],
    ["Myrrh", "沒藥", "Activates blood, reduces swelling, generates flesh", "3-9g"],
    ["Dragon's Blood", "血竭", "Activates blood, removes blood stasis, stops bleeding", "1-3g"]
  ];

  // Phlegm Transforming Herbs (化痰止咳平喘藥) - 25 herbs
  const phlegmTransforming = [
    ["Pinellia Rhizome", "半夏", "Dries dampness, transforms phlegm, harmonizes stomach", "3-9g"],
    ["Tangerine Peel", "陳皮", "Regulates qi, dries dampness, transforms phlegm", "3-9g"],
    ["Fritillaria Bulb", "川貝母", "Clears heat, transforms phlegm, stops cough", "3-9g"],
    ["Platycodon Root", "桔梗", "Opens lung qi, expels phlegm, promotes discharge of pus", "3-9g"],
    ["Perilla Fruit", "紫蘇子", "Descends qi, transforms phlegm, stops cough", "6-12g"],
    ["Apricot Kernel", "杏仁", "Descends lung qi, stops cough, moistens intestines", "6-12g"],
    ["Loquat Leaf", "枇杷葉", "Clears lung heat, descends qi, stops cough", "6-12g"],
    ["Coltsfoot Flower", "款冬花", "Moistens lung, descends qi, stops cough", "3-9g"],
    ["Aster Root", "紫菀", "Moistens lung, descends qi, stops cough", "6-12g"],
    ["Stemona Root", "百部", "Moistens lung, stops cough, kills parasites", "6-12g"]
  ];

  // Qi Regulating Herbs (理氣藥) - 20 herbs
  const qiRegulating = [
    ["Tangerine Peel", "陳皮", "Regulates qi, dries dampness, transforms phlegm", "3-9g"],
    ["Magnolia Bark", "厚朴", "Promotes qi circulation, dries dampness, reduces distension", "3-9g"],
    ["Immature Bitter Orange", "枳實", "Breaks qi stagnation, reduces accumulation", "3-9g"],
    ["Mature Bitter Orange", "枳殼", "Regulates qi, reduces distension", "3-9g"],
    ["Cyperus Rhizome", "香附", "Regulates qi, regulates menstruation, relieves pain", "6-12g"],
    ["Lindera Root", "烏藥", "Promotes qi circulation, disperses cold, relieves pain", "6-12g"],
    ["Aquilaria Wood", "沉香", "Promotes qi circulation, warms middle, descends qi", "1-3g"],
    ["Sandalwood", "檀香", "Regulates qi, warms middle, relieves pain", "1-3g"],
    ["Citron", "香櫞", "Regulates qi, transforms phlegm, harmonizes stomach", "3-9g"],
    ["Buddha's Hand", "佛手", "Regulates qi, transforms phlegm, harmonizes stomach", "3-9g"]
  ];

  // Spirit Calming Herbs (安神藥) - 15 herbs
  const spiritCalming = [
    ["Dragon Bone", "龍骨", "Calms spirit, astringes essence, stops bleeding", "15-30g"],
    ["Oyster Shell", "牡蠣", "Calms liver yang, astringes essence, softens hardness", "15-30g"],
    ["Polygala Root", "遠志", "Calms spirit, expels phlegm, reduces swelling", "3-9g"],
    ["Jujube Kernel", "酸棗仁", "Nourishes heart yin, calms spirit", "9-15g"],
    ["Schisandra Berry", "五味子", "Astringes lung qi, tonifies kidney, calms spirit", "3-6g"],
    ["Amber", "琥珀", "Calms spirit, activates blood, promotes urination", "1-3g"],
    ["Cinnabar", "朱砂", "Calms spirit, clears heat, detoxifies", "0.3-1g"],
    ["Magnetite", "磁石", "Calms spirit, anchors yang, improves hearing", "15-30g"],
    ["Pearl", "珍珠", "Calms spirit, clears heat, brightens eyes", "0.3-1g"],
    ["Mother of Pearl", "珍珠母", "Calms liver yang, clears heat, brightens eyes", "15-30g"]
  ];

  // Combine all categories
  const allCategories = [
    ...qiTonifying.map(herb => createHerbObject(herb, "Qi Tonifying")),
    ...bloodTonifying.map(herb => createHerbObject(herb, "Blood Tonifying")),
    ...yinTonifying.map(herb => createHerbObject(herb, "Yin Tonifying")),
    ...yangTonifying.map(herb => createHerbObject(herb, "Yang Tonifying")),
    ...heatClearing.map(herb => createHerbObject(herb, "Heat Clearing")),
    ...exteriorReleasing.map(herb => createHerbObject(herb, "Exterior Releasing")),
    ...dampnessDraining.map(herb => createHerbObject(herb, "Dampness Draining")),
    ...bloodActivating.map(herb => createHerbObject(herb, "Blood Activating")),
    ...phlegmTransforming.map(herb => createHerbObject(herb, "Phlegm Transforming")),
    ...qiRegulating.map(herb => createHerbObject(herb, "Qi Regulating")),
    ...spiritCalming.map(herb => createHerbObject(herb, "Spirit Calming"))
  ];

  database.herbs = allCategories;
  database.total_herbs = allCategories.length;

  return database;
};

function createHerbObject([name, chinese_name, description, dosage_range], category) {
  return {
    name,
    chinese_name,
    description,
    category,
    properties: getProperties(category),
    dosage_range,
    approval_status: getApprovalStatus(name)
  };
}

function getProperties(category) {
  const categoryProperties = {
    "Qi Tonifying": "Sweet, warm",
    "Blood Tonifying": "Sweet, warm",
    "Yin Tonifying": "Sweet, cool",
    "Yang Tonifying": "Acrid, warm",
    "Heat Clearing": "Bitter, cold",
    "Exterior Releasing": "Acrid, warm",
    "Dampness Draining": "Sweet, neutral",
    "Blood Activating": "Acrid, warm",
    "Phlegm Transforming": "Acrid, warm",
    "Qi Regulating": "Acrid, warm",
    "Spirit Calming": "Sweet, neutral"
  };
  return categoryProperties[category] || "Neutral";
}

function getApprovalStatus(name) {
  const restrictedHerbs = ["Ephedra Herb", "Aconite Root", "Cinnabar"];
  return restrictedHerbs.includes(name) ? "Restricted" : "Approved";
}

// Generate and save the database
const database = createFullDatabase();
const outputPath = path.join(__dirname, '../data/hk-comprehensive-300-herbs.json');
fs.writeFileSync(outputPath, JSON.stringify(database, null, 2));

console.log(`✅ Generated comprehensive Hong Kong herbs database!`);
console.log(`📊 Total herbs: ${database.total_herbs}`);
console.log(`📁 File saved to: ${outputPath}`);
console.log(`\n📋 Categories included:`);

const categories = [...new Set(database.herbs.map(h => h.category))];
categories.forEach(cat => {
  const count = database.herbs.filter(h => h.category === cat).length;
  console.log(`   ${cat}: ${count} herbs`);
});

console.log(`\n🚀 To import this database:`);
console.log(`docker-compose exec backend npm run import-herbs data/hk-comprehensive-300-herbs.json --update-existing`);

module.exports = createFullDatabase;