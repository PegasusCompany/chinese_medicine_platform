const db = require('../../../config/database');

// Demo prescription data with realistic TCM cases - expanded for better filtering demos
const demoPrescriptions = [
  // Recent prescriptions (last 7 days) - for date filtering
  {
    patient_name: 'Alice Wong',
    patient_phone: '+852 9111 1111',
    patient_address: '10/F, Central Tower, Central, Hong Kong',
    patient_dob: '1990-01-15',
    symptoms: 'Sudden onset headache, dizziness, high blood pressure, red face',
    diagnosis: 'Liver Yang Rising (肝阳上亢)',
    treatment_days: 7,
    doses_per_day: 3,
    notes: 'Acute condition, monitor blood pressure closely.',
    status: 'pending',
    daysAgo: 1,
    herbs: [
      { herb_name: 'Ginseng', chinese_name: '人參', quantity_per_day: 8, notes: 'Emperor - Calm Liver Wind (君药 - 平肝息风)' },
      { herb_name: 'Licorice Root', chinese_name: '甘草', quantity_per_day: 6, notes: 'Minister - Clear Liver Heat (臣药 - 清肝热)' }
    ]
  },
  {
    patient_name: 'Brian Lee',
    patient_phone: '+852 9222 2222',
    patient_address: '5/F, Kowloon Plaza, Tsim Sha Tsui',
    patient_dob: '1985-06-20',
    symptoms: 'Severe insomnia, restlessness, palpitations, anxiety',
    diagnosis: 'Heart Fire Disturbing Mind (心火扰神)',
    treatment_days: 10,
    doses_per_day: 2,
    notes: 'Work stress, recommend lifestyle changes.',
    status: 'awaiting_supplier_confirmation',
    daysAgo: 2,
    herbs: [
      { herb_name: 'Coptis Rhizome', chinese_name: '黃連', quantity_per_day: 5, notes: 'Emperor - Clear Heart Fire (君药 - 清心火)' },
      { herb_name: 'Honeysuckle Flower', chinese_name: '金銀花', quantity_per_day: 6, notes: 'Minister - Clear Heat (臣药 - 清热)' }
    ]
  },
  {
    patient_name: 'Catherine Tam',
    patient_phone: '+852 9333 3333',
    patient_address: '20/F, Harbour View, Wan Chai, Hong Kong',
    patient_dob: '1982-11-30',
    symptoms: 'Chronic fatigue, cold limbs, poor digestion, loose stools',
    diagnosis: 'Spleen Yang Deficiency (脾阳虚)',
    treatment_days: 14,
    doses_per_day: 2,
    notes: 'Constitutional weakness, long-term treatment needed.',
    status: 'assigned',
    daysAgo: 3,
    herbs: [
      { herb_name: 'Aconite', chinese_name: '附子', quantity_per_day: 6, notes: 'Emperor - Warm Spleen Yang (君药 - 温脾阳)' },
      { herb_name: 'Dried Ginger', chinese_name: '乾薑', quantity_per_day: 4, notes: 'Minister - Warm Middle Jiao (臣药 - 温中)' }
    ]
  },
  {
    patient_name: 'Daniel Chow',
    patient_phone: '+852 9444 4444',
    patient_address: '12/F, Garden Estate, Sha Tin, NT',
    patient_dob: '1975-04-10',
    symptoms: 'Joint pain, morning stiffness, swelling, difficulty moving',
    diagnosis: 'Wind-Damp Bi Syndrome (风湿痹证)',
    treatment_days: 21,
    doses_per_day: 2,
    notes: 'Chronic arthritis, weather-sensitive symptoms.',
    status: 'in_progress',
    daysAgo: 4,
    herbs: [
      { herb_name: 'Saposhnikovia Root', chinese_name: '防風', quantity_per_day: 10, notes: 'Emperor - Dispel Wind-Damp (君药 - 祛风湿)' },
      { herb_name: 'Angelica', chinese_name: '当归', quantity_per_day: 8, notes: 'Minister - Nourish Blood (臣药 - 养血)' }
    ]
  },
  {
    patient_name: 'Eva Chen',
    patient_phone: '+852 9555 5555',
    patient_address: '8/F, Luxury Court, Mid-Levels, Hong Kong',
    patient_dob: '1988-09-05',
    symptoms: 'Irregular menstruation, mood swings, breast tenderness',
    diagnosis: 'Liver Qi Stagnation (肝气郁结)',
    treatment_days: 14,
    doses_per_day: 2,
    notes: 'Hormonal imbalance, stress-related.',
    status: 'completed',
    daysAgo: 5,
    herbs: [
      { herb_name: 'Tangerine Peel', chinese_name: '陳皮', quantity_per_day: 8, notes: 'Emperor - Soothe Liver Qi (君药 - 疏肝理气)' },
      { herb_name: 'White Peony Root', chinese_name: '白芍', quantity_per_day: 10, notes: 'Minister - Nourish Liver Blood (臣药 - 养肝血)' }
    ]
  },
  {
    patient_name: 'Frank Yuen',
    patient_phone: '+852 9666 6666',
    patient_address: '15/F, Ocean Tower, Tsuen Wan, NT',
    patient_dob: '1970-12-25',
    symptoms: 'Chronic cough, thick yellow phlegm, chest tightness',
    diagnosis: 'Phlegm-Heat in Lungs (痰热壅肺)',
    treatment_days: 10,
    doses_per_day: 3,
    notes: 'Smoking history, recommend cessation.',
    status: 'cancellation_pending',
    daysAgo: 6,
    herbs: [
      { herb_name: 'Fritillaria Bulb', chinese_name: '川貝母', quantity_per_day: 8, notes: 'Emperor - Clear Lung Heat (君药 - 清肺热)' },
      { herb_name: 'Platycodon Root', chinese_name: '桔梗', quantity_per_day: 6, notes: 'Minister - Open Lung Qi (臣药 - 宣肺气)' }
    ]
  },

  // Medium-term prescriptions (8-30 days ago) - for date range filtering
  {
    patient_name: 'Grace Liu',
    patient_phone: '+852 9777 7777',
    patient_address: '25/F, Sky Tower, Causeway Bay, Hong Kong',
    patient_dob: '1993-03-18',
    symptoms: 'Heavy menstrual bleeding, fatigue, pale complexion, dizziness',
    diagnosis: 'Blood Deficiency (血虚)',
    treatment_days: 21,
    doses_per_day: 2,
    notes: 'Iron deficiency anemia, dietary counseling needed.',
    status: 'pending',
    daysAgo: 10,
    herbs: [
      { herb_name: 'Angelica', chinese_name: '当归', quantity_per_day: 12, notes: 'Emperor - Nourish Blood (君药 - 养血)' },
      { herb_name: 'Prepared Rehmannia Root', chinese_name: '熟地黃', quantity_per_day: 15, notes: 'Minister - Tonify Blood (臣药 - 补血)' }
    ]
  },
  {
    patient_name: 'Henry Kwok',
    patient_phone: '+852 9888 8888',
    patient_address: '3/F, Village House, Tai Po, NT',
    patient_dob: '1965-07-08',
    symptoms: 'Lower back pain, knee weakness, frequent urination at night',
    diagnosis: 'Kidney Yang Deficiency (肾阳虚)',
    treatment_days: 28,
    doses_per_day: 2,
    notes: 'Age-related decline, long-term maintenance needed.',
    status: 'awaiting_supplier_confirmation',
    daysAgo: 12,
    herbs: [
      { herb_name: 'Aconite', chinese_name: '附子', quantity_per_day: 6, notes: 'Emperor - Warm Kidney Yang (君药 - 温肾阳)' },
      { herb_name: 'Cinnamon Bark', chinese_name: '肉桂', quantity_per_day: 3, notes: 'Minister - Assist Yang (臣药 - 助阳)' }
    ]
  },
  {
    patient_name: 'Iris Mak',
    patient_phone: '+852 9999 9999',
    patient_address: '18/F, Metro Plaza, Mong Kok, Kowloon',
    patient_dob: '1987-02-14',
    symptoms: 'Digestive problems, bloating, poor appetite, fatigue after eating',
    diagnosis: 'Spleen Qi Deficiency (脾气虚)',
    treatment_days: 14,
    doses_per_day: 3,
    notes: 'Irregular eating habits, stress-related digestive issues.',
    status: 'assigned',
    daysAgo: 15,
    herbs: [
      { herb_name: 'Ginseng', chinese_name: '人参', quantity_per_day: 9, notes: 'Emperor - Tonify Spleen Qi (君药 - 补脾气)' },
      { herb_name: 'Atractylodes Rhizome', chinese_name: '白朮', quantity_per_day: 9, notes: 'Minister - Strengthen Spleen (臣药 - 健脾)' }
    ]
  },
  {
    patient_name: 'Jack Tsang',
    patient_phone: '+852 9101 0101',
    patient_address: '7/F, Commercial Building, Central, Hong Kong',
    patient_dob: '1980-10-22',
    symptoms: 'Chronic headaches, neck tension, stress, poor sleep quality',
    diagnosis: 'Liver Yang Rising (肝阳上亢)',
    treatment_days: 14,
    doses_per_day: 2,
    notes: 'High-pressure job, recommend stress management techniques.',
    status: 'in_progress',
    daysAgo: 18,
    herbs: [
      { herb_name: 'Astragalus Root', chinese_name: '黃芪', quantity_per_day: 8, notes: 'Emperor - Calm Liver Wind (君药 - 平肝息风)' },
      { herb_name: 'White Peony Root', chinese_name: '白芍', quantity_per_day: 6, notes: 'Minister - Clear Heat (臣药 - 清热)' }
    ]
  },
  {
    patient_name: 'Kelly Ng',
    patient_phone: '+852 9202 0202',
    patient_address: '14/F, Residential Tower, Tuen Mun, NT',
    patient_dob: '1992-08-30',
    symptoms: 'Anxiety, panic attacks, insomnia, palpitations, sweating',
    diagnosis: 'Heart Blood Deficiency (心血虚)',
    treatment_days: 21,
    doses_per_day: 2,
    notes: 'Anxiety disorder, consider counseling support.',
    status: 'completed',
    daysAgo: 20,
    herbs: [
      { herb_name: 'Jujube Kernel', chinese_name: '酸棗仁', quantity_per_day: 12, notes: 'Emperor - Calm Spirit (君药 - 安神)' },
      { herb_name: 'Angelica', chinese_name: '当归', quantity_per_day: 10, notes: 'Minister - Nourish Blood (臣药 - 养血)' }
    ]
  },
  {
    patient_name: 'Leo Cheung',
    patient_phone: '+852 9303 0303',
    patient_address: '9/F, Harbor View, Aberdeen, Hong Kong',
    patient_dob: '1978-05-12',
    symptoms: 'Chronic fatigue, shortness of breath, weak voice, sweating',
    diagnosis: 'Lung Qi Deficiency (肺气虚)',
    treatment_days: 21,
    doses_per_day: 2,
    notes: 'Post-viral fatigue syndrome, gradual recovery expected.',
    status: 'cancellation_pending',
    daysAgo: 22,
    herbs: [
      { herb_name: 'Astragalus', chinese_name: '黄芪', quantity_per_day: 15, notes: 'Emperor - Tonify Lung Qi (君药 - 补肺气)' },
      { herb_name: 'Ginseng', chinese_name: '人参', quantity_per_day: 6, notes: 'Minister - Tonify Yuan Qi (臣药 - 补元气)' }
    ]
  },

  // Older prescriptions (30+ days ago) - for comprehensive date filtering
  {
    patient_name: 'Mary Lau',
    patient_phone: '+852 9404 0404',
    patient_address: '11/F, Golden Plaza, Tsim Sha Tsui, Kowloon',
    patient_dob: '1985-01-28',
    symptoms: 'Hot flashes, night sweats, mood swings, irregular periods',
    diagnosis: 'Kidney Yin Deficiency (肾阴虚)',
    treatment_days: 28,
    doses_per_day: 2,
    notes: 'Perimenopause symptoms, hormone replacement alternative.',
    status: 'pending',
    daysAgo: 35,
    herbs: [
      { herb_name: 'Prepared Rehmannia Root', chinese_name: '熟地黃', quantity_per_day: 15, notes: 'Emperor - Nourish Kidney Yin (君药 - 滋肾阴)' },
      { herb_name: 'Cornus', chinese_name: '山茱萸', quantity_per_day: 8, notes: 'Minister - Tonify Kidney (臣药 - 补肾)' }
    ]
  },
  {
    patient_name: 'Nathan Ho',
    patient_phone: '+852 9505 0505',
    patient_address: '6/F, Modern Complex, Kwun Tong, Kowloon',
    patient_dob: '1972-11-15',
    symptoms: 'Chronic diarrhea, abdominal pain, cold limbs, fatigue',
    diagnosis: 'Spleen Yang Deficiency (脾阳虚)',
    treatment_days: 21,
    doses_per_day: 3,
    notes: 'Chronic colitis, dietary modifications essential.',
    status: 'awaiting_supplier_confirmation',
    daysAgo: 40,
    herbs: [
      { herb_name: 'Aconite', chinese_name: '附子', quantity_per_day: 6, notes: 'Emperor - Warm Spleen Yang (君药 - 温脾阳)' },
      { herb_name: 'Dried Ginger', chinese_name: '乾薑', quantity_per_day: 4, notes: 'Minister - Warm Middle (臣药 - 温中)' }
    ]
  },
  {
    patient_name: 'Olivia Yip',
    patient_phone: '+852 9606 0606',
    patient_address: '22/F, Seaside Tower, Stanley, Hong Kong',
    patient_dob: '1990-06-08',
    symptoms: 'Skin rashes, itching, redness, heat sensation, thirst',
    diagnosis: 'Blood Heat (血热)',
    treatment_days: 14,
    doses_per_day: 2,
    notes: 'Eczema flare-up, avoid spicy foods and alcohol.',
    status: 'assigned',
    daysAgo: 45,
    herbs: [
      { herb_name: 'Raw Rehmannia Root', chinese_name: '生地黃', quantity_per_day: 12, notes: 'Emperor - Cool Blood Heat (君药 - 凉血热)' },
      { herb_name: 'Red Peony Root', chinese_name: '赤芍', quantity_per_day: 8, notes: 'Minister - Clear Heat (臣药 - 清热)' }
    ]
  },
  {
    patient_name: 'Peter Siu',
    patient_phone: '+852 9707 0707',
    patient_address: '4/F, Heritage Court, Sheung Wan, Hong Kong',
    patient_dob: '1968-09-20',
    symptoms: 'Memory problems, dizziness, tinnitus, lower back pain',
    diagnosis: 'Kidney Essence Deficiency (肾精不足)',
    treatment_days: 28,
    doses_per_day: 2,
    notes: 'Age-related cognitive decline, long-term treatment plan.',
    status: 'in_progress',
    daysAgo: 50,
    herbs: [
      { herb_name: 'Prepared Rehmannia Root', chinese_name: '熟地黃', quantity_per_day: 15, notes: 'Emperor - Tonify Kidney Essence (君药 - 补肾精)' },
      { herb_name: 'Cornus', chinese_name: '山茱萸', quantity_per_day: 10, notes: 'Minister - Secure Essence (臣药 - 固精)' }
    ]
  },
  {
    patient_name: 'Queenie Fung',
    patient_phone: '+852 9808 0808',
    patient_address: '16/F, City Plaza, Tai Koo, Hong Kong',
    patient_dob: '1983-12-03',
    symptoms: 'Chronic constipation, dry stools, thirst, dry mouth',
    diagnosis: 'Intestinal Dryness (肠燥)',
    treatment_days: 14,
    doses_per_day: 2,
    notes: 'Lifestyle-related constipation, increase fiber and fluids.',
    status: 'completed',
    daysAgo: 55,
    herbs: [
      { herb_name: 'Coix Seed', chinese_name: '薏苡仁', quantity_per_day: 10, notes: 'Emperor - Moisten Intestines (君药 - 润肠)' },
      { herb_name: 'Angelica', chinese_name: '当归', quantity_per_day: 8, notes: 'Minister - Nourish Blood (臣药 - 养血)' }
    ]
  },

  // Additional cases for comprehensive filtering
  {
    patient_name: 'Raymond Tse',
    patient_phone: '+852 9909 0909',
    patient_address: '13/F, Business Center, Admiralty, Hong Kong',
    patient_dob: '1975-04-17',
    symptoms: 'Chronic pain, muscle tension, stress, poor sleep',
    diagnosis: 'Qi and Blood Stagnation (气血瘀滞)',
    treatment_days: 21,
    doses_per_day: 2,
    notes: 'Chronic pain syndrome, consider acupuncture adjunct.',
    status: 'cancellation_pending',
    daysAgo: 60,
    herbs: [
      { herb_name: 'Angelica', chinese_name: '当归', quantity_per_day: 10, notes: 'Emperor - Move Blood (君药 - 活血)' },
      { herb_name: 'Ligusticum Rhizome', chinese_name: '川芎', quantity_per_day: 6, notes: 'Minister - Move Qi (臣药 - 行气)' }
    ]
  },
  {
    patient_name: 'Samantha Kwan',
    patient_phone: '+852 9010 1010',
    patient_address: '19/F, Luxury Residence, Repulse Bay, Hong Kong',
    patient_dob: '1988-07-25',
    symptoms: 'Chronic headaches, eye strain, neck stiffness, irritability',
    diagnosis: 'Liver Fire Rising (肝火上炎)',
    treatment_days: 10,
    doses_per_day: 3,
    notes: 'Computer work-related symptoms, ergonomic assessment needed.',
    status: 'pending',
    daysAgo: 8,
    herbs: [
      { herb_name: 'Coptis Rhizome', chinese_name: '黃連', quantity_per_day: 6, notes: 'Emperor - Clear Liver Fire (君药 - 清肝火)' },
      { herb_name: 'Honeysuckle Flower', chinese_name: '金銀花', quantity_per_day: 8, notes: 'Minister - Clear Heat (臣药 - 清热)' }
    ]
  },
  {
    patient_name: 'Tony Lam',
    patient_phone: '+852 9121 2121',
    patient_address: '21/F, Tower One, Kowloon Bay, Kowloon',
    patient_dob: '1982-02-28',
    symptoms: 'Chronic fatigue, poor concentration, forgetfulness, depression',
    diagnosis: 'Heart and Spleen Deficiency (心脾两虚)',
    treatment_days: 28,
    doses_per_day: 2,
    notes: 'Burnout syndrome, work-life balance counseling recommended.',
    status: 'awaiting_supplier_confirmation',
    daysAgo: 25,
    herbs: [
      { herb_name: 'Ginseng', chinese_name: '人参', quantity_per_day: 9, notes: 'Emperor - Tonify Heart and Spleen (君药 - 补心脾)' },
      { herb_name: 'Longan Flesh', chinese_name: '龍眼肉', quantity_per_day: 10, notes: 'Minister - Nourish Heart (臣药 - 养心)' }
    ]
  },
  {
    patient_name: 'Vivian Choi',
    patient_phone: '+852 9232 3232',
    patient_address: '17/F, Garden View, Tai Wai, NT',
    patient_dob: '1991-10-11',
    symptoms: 'Frequent colds, low immunity, fatigue, poor appetite',
    diagnosis: 'Lung and Spleen Qi Deficiency (肺脾气虚)',
    treatment_days: 21,
    doses_per_day: 2,
    notes: 'Recurrent respiratory infections, immune system support needed.',
    status: 'assigned',
    daysAgo: 30,
    herbs: [
      { herb_name: 'Astragalus', chinese_name: '黄芪', quantity_per_day: 12, notes: 'Emperor - Tonify Lung Qi (君药 - 补肺气)' },
      { herb_name: 'Atractylodes Rhizome', chinese_name: '白朮', quantity_per_day: 9, notes: 'Minister - Strengthen Spleen (臣药 - 健脾)' }
    ]
  },
  {
    patient_name: 'William Yau',
    patient_phone: '+852 9343 4343',
    patient_address: '23/F, Metro Tower, Tsuen Wan, NT',
    patient_dob: '1977-08-14',
    symptoms: 'High blood pressure, dizziness, headaches, red face, anger',
    diagnosis: 'Liver Yang Hyperactivity (肝阳亢盛)',
    treatment_days: 14,
    doses_per_day: 3,
    notes: 'Hypertension management, lifestyle modifications essential.',
    status: 'in_progress',
    daysAgo: 14,
    herbs: [
      { herb_name: 'Poria', chinese_name: '茯苓', quantity_per_day: 10, notes: 'Emperor - Subdue Liver Yang (君药 - 平肝阳)' },
      { herb_name: 'Tangerine Peel', chinese_name: '陳皮', quantity_per_day: 15, notes: 'Minister - Anchor Yang (臣药 - 潜阳)' }
    ]
  },
  {
    patient_name: 'Zoe Leung',
    patient_phone: '+852 9454 5454',
    patient_address: '26/F, Skyline Building, North Point, Hong Kong',
    patient_dob: '1986-12-07',
    symptoms: 'Chronic cough, dry throat, night sweats, low-grade fever',
    diagnosis: 'Lung Yin Deficiency (肺阴虚)',
    treatment_days: 21,
    doses_per_day: 2,
    notes: 'Post-infectious cough, avoid dry and hot environments.',
    status: 'completed',
    daysAgo: 42,
    herbs: [
      { herb_name: 'Ophiopogon Root', chinese_name: '麥門冬', quantity_per_day: 10, notes: 'Emperor - Nourish Lung Yin (君药 - 养肺阴)' },
      { herb_name: 'Fritillaria Bulb', chinese_name: '川貝母', quantity_per_day: 12, notes: 'Minister - Moisten Lungs (臣药 - 润肺)' }
    ]
  }
];

async function createDemoData() {
  try {
    console.log('🚀 Starting demo data creation...');

    // Test database connection
    await db.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL database');

    // 1. Clean up existing test data
    console.log('🧹 Cleaning up existing test data...');

    // Delete existing orders first (foreign key constraint)
    await db.query('DELETE FROM orders WHERE prescription_id IN (SELECT id FROM prescriptions)');
    console.log('   - Deleted existing orders');

    // Delete existing prescription items
    await db.query('DELETE FROM prescription_items WHERE prescription_id IN (SELECT id FROM prescriptions)');
    console.log('   - Deleted existing prescription items');

    // Delete existing prescriptions
    await db.query('DELETE FROM prescriptions');
    console.log('   - Deleted existing prescriptions');

    // Reset sequences (PostgreSQL equivalent of auto-increment)
    try {
      await db.query('ALTER SEQUENCE prescriptions_id_seq RESTART WITH 1');
      await db.query('ALTER SEQUENCE prescription_items_id_seq RESTART WITH 1');
      await db.query('ALTER SEQUENCE orders_id_seq RESTART WITH 1');
      console.log('   - Reset sequence counters');
    } catch (seqError) {
      console.log('   - Note: Some sequences may not exist yet (this is normal for new databases)');
    }

    // 2. Get practitioner ID (assuming Dr. Li Wei from seed data)
    const practitionerResult = await db.query(
      'SELECT id FROM users WHERE user_type = $1 AND name = $2 LIMIT 1',
      ['practitioner', 'Dr. Li Wei']
    );

    if (practitionerResult.rows.length === 0) {
      throw new Error('Practitioner not found. Please run seed-users.js first.');
    }

    const practitionerId = practitionerResult.rows[0].id;
    console.log(`✅ Found practitioner ID: ${practitionerId}`);

    // 3. Get supplier ID
    const supplierResult = await db.query(
      'SELECT id FROM users WHERE user_type = $1 LIMIT 1',
      ['supplier']
    );

    if (supplierResult.rows.length === 0) {
      throw new Error('Supplier not found. Please run seed-users.js first.');
    }

    const supplierId = supplierResult.rows[0].id;
    console.log(`✅ Found supplier ID: ${supplierId}`);

    // 4. Create demo prescriptions
    console.log('📝 Creating demo prescriptions...');

    for (let i = 0; i < demoPrescriptions.length; i++) {
      const prescription = demoPrescriptions[i];

      // Use custom daysAgo if specified, otherwise random
      const daysAgo = prescription.daysAgo || Math.floor(Math.random() * 30) + 1;
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      // Insert prescription
      const prescriptionResult = await db.query(
        `INSERT INTO prescriptions (
          practitioner_id, patient_name, patient_phone, patient_address, patient_dob,
          symptoms, diagnosis, treatment_days, doses_per_day, notes, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [
          practitionerId,
          prescription.patient_name,
          prescription.patient_phone,
          prescription.patient_address,
          prescription.patient_dob,
          prescription.symptoms,
          prescription.diagnosis,
          prescription.treatment_days,
          prescription.doses_per_day,
          prescription.notes,
          prescription.status,
          createdAt
        ]
      );

      const prescriptionId = prescriptionResult.rows[0].id;

      // Insert prescription items (herbs)
      for (const herb of prescription.herbs) {
        // Get herb ID from database
        const herbResults = await db.query(
          'SELECT id FROM herbs WHERE name = $1 OR chinese_name = $2 LIMIT 1',
          [herb.herb_name, herb.chinese_name]
        );

        const herbId = herbResults.rows.length > 0 ? herbResults.rows[0].id : null;

        // Calculate total quantity (quantity per day * doses per day * treatment days)
        const totalQuantity = herb.quantity_per_day * prescription.doses_per_day * prescription.treatment_days;

        await db.query(
          `INSERT INTO prescription_items (
            prescription_id, herb_id, quantity_per_day, total_quantity, notes
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            prescriptionId,
            herbId,
            herb.quantity_per_day,
            totalQuantity,
            herb.notes
          ]
        );
      }

      // Create corresponding orders for certain statuses
      if (['awaiting_supplier_confirmation', 'assigned', 'in_progress', 'completed', 'cancellation_pending'].includes(prescription.status)) {
        let orderStatus = 'accepted';
        let estimatedCompletion = null;

        // Set order status based on prescription status
        switch (prescription.status) {
          case 'awaiting_supplier_confirmation':
            orderStatus = 'accepted';
            estimatedCompletion = new Date();
            estimatedCompletion.setDate(estimatedCompletion.getDate() + 3);
            break;
          case 'assigned':
            orderStatus = 'preparing';
            estimatedCompletion = new Date();
            estimatedCompletion.setDate(estimatedCompletion.getDate() + 2);
            break;
          case 'in_progress':
            orderStatus = 'packed';
            estimatedCompletion = new Date();
            estimatedCompletion.setDate(estimatedCompletion.getDate() + 1);
            break;
          case 'completed':
            orderStatus = 'delivered';
            break;
          case 'cancellation_pending':
            orderStatus = 'accepted'; // Keep as accepted but will be handled separately
            break;
        }

        // Calculate total amount (rough estimate)
        const totalAmount = prescription.herbs.reduce((sum, herb) => {
          return sum + (herb.quantity_per_day * prescription.treatment_days * prescription.doses_per_day * 2.5); // HK$2.5 per gram average
        }, 0);

        await db.query(
          `INSERT INTO orders (
            prescription_id, supplier_id, status, total_amount, estimated_completion, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            prescriptionId,
            supplierId,
            orderStatus,
            Math.round(totalAmount * 100) / 100, // Round to 2 decimal places
            estimatedCompletion,
            createdAt
          ]
        );
      }

      console.log(`   ✅ Created prescription ${i + 1}: ${prescription.patient_name} - ${prescription.diagnosis}`);
    }

    console.log('🎉 Demo data creation completed successfully!');
    console.log(`📊 Created ${demoPrescriptions.length} demo prescriptions with various statuses`);
    console.log('📋 Status distribution:');

    // Count prescriptions by status
    const statusCounts = {};
    demoPrescriptions.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} prescriptions`);
    });

    console.log('\n🎬 Your demo data is ready for presentations!');
    console.log('💡 Features showcased:');
    console.log('   - Various TCM diagnoses and treatments');
    console.log('   - Different prescription statuses');
    console.log('   - Bilingual herb names and roles');
    console.log('   - Realistic patient information');
    console.log('   - Complete order workflow');
    console.log('   - Diverse timeline spread');

  } catch (error) {
    console.error('❌ Error creating demo data:', error.message);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createDemoData()
    .then(() => {
      console.log('✨ Demo data script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Demo data script failed:', error);
      process.exit(1);
    });
}

module.exports = { createDemoData };