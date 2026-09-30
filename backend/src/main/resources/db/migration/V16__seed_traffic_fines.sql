-- Seed official Uzbekistan MJtK traffic fines into traffic_fines table
TRUNCATE TABLE traffic_fines RESTART IDENTITY CASCADE;

INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '123-modda 1-band',
  'Poyezdlarning vagonlari, avtotransport vositalari shahar yo‘lovchilar transportidan va suv transportidan axlat yoki boshqa narsalarni tashlab yuborish —
bazaviy hisoblash miqdorining bir baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Поездларнинг вагонлари, автотранспорт воситалари шаҳар йўловчилар транспортидан ва сув транспортидан ахлат ёки бошқа нарсаларни ташлаб юбориш —
базавий ҳисоблаш миқдорининг бир баравари миқдорида жарима солишга сабаб бўлади.',
  'Выбрасывание мусора или иных предметов из вагонов поездов, автотранспортных средств городского пассажирского транспорта и водного транспорта —
влечет наложение штрафа в сумме одной базовой расчетной величины.',
  1,
  NULL,
  1,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '125-modda 1-band',
  'Haydovchilarning transport vositalarini boshqarish va yo‘lovchilar tashishda xavfsizlik kamaridan foydalanish qoidalariga, xuddi shuningdek mototsikl va mopedlar haydovchilarining motoshlemlardan foydalanish qoidalariga rioya etmasligi, —
bazaviy hisoblash miqdorining ikkidan bir qismi miqdorida jarima solishga sabab bo‘ladi.',
  'Ҳайдовчиларнинг транспорт воситаларини бошқариш ва йўловчилар ташишда хавфсизлик камаридан фойдаланиш қоидаларига, худди шунингдек мотоцикл ва мопедлар ҳайдовчиларининг мотошлемлардан фойдаланиш қоидаларига риоя этмаслиги, —
базавий ҳисоблаш миқдорининг иккидан бир қисми миқдорида жарима солишга сабаб бўлади.',
  'Несоблюдение водителями правил пользования ремнями безопасности при управлении транспортными средствами и перевозке пассажиров, а равно несоблюдение водителями мотоциклов и мопедов правил пользования мотошлемами, —
влечет наложение штрафа в сумме одной второй базовой расчетной величины.',
  0.5,
  NULL,
  2,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '125-modda 2-band',
  'Haydovchilarning belgilangan tartibda ro‘yxatdan o‘tkazilmagan yoki majburiy texnik ko‘rikdan o‘tkazilmagan yoxud foydalanish man etiladigan darajada nosozligi bo‘lgan yoki qonunchilikda belgilangan tartibda favqulodda vaziyatda oynani sindirish uchun foydalaniladigan bolg‘acha bilan jihozlanmagan, o‘t o‘chirgich, tibbiyot qutichasi, avariya holatida to‘xtaganligini bildiruvchi belgi va nur qaytargichli kamzul bilan butlanmagan, xuddi shuningdek ishlayotganida tashqariga chiqarayotgan ifloslantiruvchi moddalarning miqdori, shuningdek shovqin darajasi belgilangan normalardan ortiq bo‘lgan transport vositalarini boshqarishi, —
bazaviy hisoblash miqdorining ikkidan bir qismi miqdorida jarima solishga sabab bo‘ladi.',
  'Ҳайдовчиларнинг белгиланган тартибда рўйхатдан ўтказилмаган ёки мажбурий техник кўрикдан ўтказилмаган ёхуд фойдаланиш ман этиладиган даражада носозлиги бўлган ёки қонунчиликда белгиланган тартибда фавқулодда вазиятда ойнани синдириш учун фойдаланиладиган болғача билан жиҳозланмаган, ўт ўчиргич, тиббиёт қутичаси, авария ҳолатида тўхтаганлигини билдирувчи белги ва нур қайтаргичли камзул билан бутланмаган, худди шунингдек ишлаётганида ташқарига чиқараётган ифлослантирувчи моддаларнинг миқдори, шунингдек шовқин даражаси белгиланган нормалардан ортиқ бўлган транспорт воситаларини бошқариши, —
базавий ҳисоблаш миқдорининг иккидан бир қисми миқдорида жарима солишга сабаб бўлади.',
  'Управление водителями транспортными средствами, не зарегистрированными в установленном порядке или не прошедшими обязательный технический осмотр либо имеющими неисправности или в установленном законодательством порядке необорудованными молотком для разбивания стекол в чрезвычайной ситуации, неукомплектованными огнетушителем, медицинской аптечкой, знаком аварийной остановки и световозвращающим жилетом, с которыми запрещена их эксплуатация, а равно у которых содержание загрязняющих веществ в выбросах, а также уровень шума, производимого ими при работе, превышают установленные нормы, —
влечет наложение штрафа в сумме одной второй базовой расчетной величины.',
  0.5,
  NULL,
  3,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '125-modda 3-band',
  'Haydovchilarning tormoz tizimida, rul boshqaruvida yoki ulovchi qurilmada nosozligi bo‘lgan yoxud tegishli ruxsatnomasiz qayta jihozlangan transport vositalarini boshqarishi, —
bazaviy hisoblash miqdorining bir baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Ҳайдовчиларнинг тормоз тизимида, руль бошқарувида ёки уловчи қурилмада носозлиги бўлган ёхуд тегишли рухсатномасиз қайта жиҳозланган транспорт воситаларини бошқариши, —
базавий ҳисоблаш миқдорининг бир баравари миқдорида жарима солишга сабаб бўлади.',
  'Управление водителями транспортными средствами, имеющими неисправности тормозной системы, рулевого управления или сцепного устройства либо переоборудованными без соответствующего разрешения, —
влечет наложение штрафа в сумме одной базовой расчетной величины.',
  1,
  NULL,
  4,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '125-modda 4-band',
  'Haydovchilarning shaharlararo va xalqaro yo‘lovchi tashishni amalga oshiradigan avtobuslarni nazorat asboblarisiz (taxograflarsiz) yoki taxograflarni o‘chirgan holda boshqarishi, —
bazaviy hisoblash miqdorining uch baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Ҳайдовчиларнинг шаҳарлараро ва халқаро йўловчи ташишни амалга оширадиган автобусларни назорат асбобларисиз (тахографларсиз) ёки тахографларни ўчирган ҳолда бошқариши, —
базавий ҳисоблаш миқдорининг уч баравари миқдорида жарима солишга сабаб бўлади.',
  'Управление водителями автобусами, осуществляющими междугородные и международные пассажирские перевозки, без контрольных приборов (тахографов) или с выключенными тахографами —
влечет наложение штрафа в сумме трех базовых расчетных величин.',
  3,
  NULL,
  5,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '125-modda 5-band',
  'Foydalanish belgilangan tartibda man etilgan transport vositalarini, xuddi shuningdek davlat raqam belgisi o‘zboshimchalik bilan yechib olingan transport vositalarini boshqarish —
bazaviy hisoblash miqdorining besh baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Фойдаланиш белгиланган тартибда ман этилган транспорт воситаларини, худди шунингдек давлат рақам белгиси ўзбошимчалик билан ечиб олинган транспорт воситаларини бошқариш —
базавий ҳисоблаш миқдорининг беш баравари миқдорида жарима солишга сабаб бўлади.',
  'Управление транспортными средствами, эксплуатация которых запрещена в установленном порядке, а равно транспортными средствами, с которых самовольно сняты государственные номерные знаки, —
влечет наложение штрафа в сумме пяти базовых расчетных величин.',
  5,
  NULL,
  6,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '125-modda 6-band',
  'Davlat raqam belgisi ayni shu transport vositasiga tegishli bo‘lmagan transport vositasini boshqarish —
bazaviy hisoblash miqdorining o‘n baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Давлат рақам белгиси айни шу транспорт воситасига тегишли бўлмаган транспорт воситасини бошқариш —
базавий ҳисоблаш миқдорининг ўн баравари миқдорида жарима солишга сабаб бўлади.',
  'Управление транспортным средством с государственным номерным знаком, не принадлежащим этому транспортному средству, —
влечет наложение штрафа в сумме десяти базовых расчетных величин.',
  10,
  NULL,
  7,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '125-modda 7-band',
  'Korxonalar, muassasalar va tashkilotlarga qarashli transport vositalarini ishdan tashqari vaqtda ulardan foydalanish shartlariga muvofiq keladigan tarzda maxsus jihozlanmagan joyda saqlash —
fuqarolarga bazaviy hisoblash miqdorining bir baravari, mansabdor shaxslarga esa — ikki baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Корхоналар, муассасалар ва ташкилотларга қарашли транспорт воситаларини ишдан ташқари вақтда улардан фойдаланиш шартларига мувофиқ келадиган тарзда махсус жиҳозланмаган жойда сақлаш —
фуқароларга базавий ҳисоблаш миқдорининг бир баравари, мансабдор шахсларга эса — икки баравари миқдорида жарима солишга сабаб бўлади.',
  'Хранение транспортных средств, принадлежащих предприятиям, учреждениям и организациям, в местах, специально не установленных по условиям эксплуатации для их стоянки в нерабочее время, —
влечет наложение штрафа на граждан в сумме одной, а на должностных лиц — двух базовых расчетных величин.',
  1,
  2,
  8,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '1-modda 1-band',
  'Yuk tashish qoidalarini, xuddi shuningdek shatakka olish qoidalarini buzish, —
bazaviy hisoblash miqdorining o‘n baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Юк ташиш қоидаларини, худди шунингдек шатакка олиш қоидаларини бузиш, —
базавий ҳисоблаш миқдорининг ўн баравари миқдорида жарима солишга сабаб бўлади.',
  'Нарушение правил перевозки грузов, а равно правил буксировки —
влечет наложение штрафа в сумме десяти базовых расчетных величин.',
  10,
  NULL,
  9,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '1-modda 2-band',
  'Yuk bilan yoki yuksiz holdagi gabarit o‘lchamlari, shuningdek umumiy haqiqiy vazni, o‘qqa tushuvchi og‘irligi belgilangan normadan o‘n foizgacha ortiq bo‘lgan transport vositalarida yo‘lga chiqish, —
bazaviy hisoblash miqdorining o‘n baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Юк билан ёки юксиз ҳолдаги габарит ўлчамлари, шунингдек умумий ҳақиқий вазни, ўққа тушувчи оғирлиги белгиланган нормадан ўн фоизгача ортиқ бўлган транспорт воситаларида йўлга чиқиш, —
базавий ҳисоблаш миқдорининг ўн баравари миқдорида жарима солишга сабаб бўлади.',
  'Выезд на дорогу на транспортных средствах, габаритные параметры которых с грузом или без груза, а также общая фактическая масса, осевые нагрузки превышают до десяти процентов установленную норму —
влечет наложение штрафа в сумме десяти базовых расчетных величин.',
  10,
  NULL,
  10,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '1-modda 3-band',
  'Yuk bilan yoki yuksiz holdagi gabarit o‘lchamlari, shuningdek umumiy haqiqiy vazni, o‘qqa tushuvchi og‘irligi belgilangan normadan o‘n foizdan yigirma foizgacha ortiq bo‘lgan transport vositalarida yo‘lga chiqish, —
bazaviy hisoblash miqdorining o‘n besh baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Юк билан ёки юксиз ҳолдаги габарит ўлчамлари, шунингдек умумий ҳақиқий вазни, ўққа тушувчи оғирлиги белгиланган нормадан ўн фоиздан йигирма фоизгача ортиқ бўлган транспорт воситаларида йўлга чиқиш, —
базавий ҳисоблаш миқдорининг ўн беш баравари миқдорида жарима солишга сабаб бўлади.',
  'Выезд на дорогу на транспортных средствах, габаритные параметры которых с грузом или без груза, а также общая фактическая масса, осевые нагрузки превышают от десяти до двадцати процентов установленную норму —
влечет наложение штрафа в сумме пятнадцати базовых расчетных величин.',
  15,
  NULL,
  11,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '1-modda 4-band',
  'Tegishli ruxsatnomasiz og‘ir vaznli, yirik gabaritli, xavfli yuklarni tashish, yuk bilan yoki yuksiz holdagi gabarit o‘lchamlari, shuningdek umumiy haqiqiy vazni, o‘qqa tushuvchi og‘irligi belgilangan normadan yigirma foizdan ortiq bo‘lgan transport vositalarida yo‘lga chiqish, xuddi shuningdek ruxsatnomada ko‘rsatilgan harakat yo‘nalishidan chetga chiqish, —
bazaviy hisoblash miqdorining yigirma baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Тегишли рухсатномасиз оғир вазнли, йирик габаритли, хавфли юкларни ташиш, юк билан ёки юксиз ҳолдаги габарит ўлчамлари, шунингдек умумий ҳақиқий вазни, ўққа тушувчи оғирлиги белгиланган нормадан йигирма фоиздан ортиқ бўлган транспорт воситаларида йўлга чиқиш, худди шунингдек рухсатномада кўрсатилган ҳаракат йўналишидан четга чиқиш, —
базавий ҳисоблаш миқдорининг йигирма баравари миқдорида жарима солишга сабаб бўлади.',
  'Перевозка тяжеловесных, крупногабаритных, опасных грузов, выезд на дорогу на транспортных средствах, габаритные параметры которых с грузом или без груза, а также общая фактическая масса, осевые нагрузки превышают на двадцать процентов установленную норму, без наличия соответствующего разрешения, а равно с отклонением от маршрута движения, указанного в разрешении, —
влечет наложение штрафа в сумме двадцати базовых расчетных величин.',
  20,
  NULL,
  12,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '2-modda 1-band',
  'Xorijiy tashuvchilarga tegishli bo‘lgan, shu jumladan ular tomonidan O‘zbekiston Respublikasi hududiga vaqtincha olib kirilgan avtotransport vositalarida yo‘lovchilar va yuklarni O‘zbekiston Respublikasi hududida joylashgan punktlar o‘rtasida tashish (kabotaj), agar O‘zbekiston Respublikasining xalqaro shartnomalarida boshqacha qoida nazarda tutilmagan bo‘lsa, —
bazaviy hisoblash miqdorining yigirma baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Хорижий ташувчиларга тегишли бўлган, шу жумладан улар томонидан Ўзбекистон Республикаси ҳудудига вақтинча олиб кирилган автотранспорт воситаларида йўловчилар ва юкларни Ўзбекистон Республикаси ҳудудида жойлашган пунктлар ўртасида ташиш (каботаж), агар Ўзбекистон Республикасининг халқаро шартномаларида бошқача қоида назарда тутилмаган бўлса, —
базавий ҳисоблаш миқдорининг йигирма баравари миқдорида жарима солишга сабаб бўлади.',
  'Перевозка грузов и пассажиров автотранспортными средствами, принадлежащими иностранным перевозчикам, в том числе временно ввезенными ими на территорию Республики Узбекистан, между пунктами, расположенными на территории Республики Узбекистан (каботаж), если иное не оговорено международными договорами Республики Узбекистан, —
влечет наложение штрафа в сумме двадцати базовых расчетных величин.',
  20,
  NULL,
  13,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '3-modda 1-band',
  'Siqilgan tabiiy gazda, suyultirilgan neft gazida yoki dizel va gazsimon yoqilg‘i aralashmasida ishlaydigan transport vositalaridan foydalanishda xavfsizlik qoidalarini buzish, —
fuqarolarga bazaviy hisoblash miqdorining besh baravari miqdorida, mansabdor shaxslarga esa o‘n baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Сиқилган табиий газда, суюлтирилган нефть газида ёки дизель ва газсимон ёқилғи аралашмасида ишлайдиган транспорт воситаларидан фойдаланишда хавфсизлик қоидаларини бузиш, —
фуқароларга базавий ҳисоблаш миқдорининг беш баравари миқдорида, мансабдор шахсларга эса ўн баравари миқдорида жарима солишга сабаб бўлади.',
  'Нарушение правил безопасности при эксплуатации транспортных средств, работающих на сжатом природном газе, сжиженном нефтяном газе или смеси дизельного и газообразного топлива, —
влечет наложение штрафа на граждан в размере пяти, а на должностных лиц — десяти базовых расчетных величин.',
  5,
  10,
  14,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '126-modda 1-band',
  'Texnik reglamentga muvofiq bo‘lmagan ko‘zgusimon va (yoki) tusi o‘zgartirilgan (qoraytirilgan) oynali transport vositalaridan, xuddi shuningdek haydovchining o‘rnidan tevarak-atrofni ko‘rishni cheklaydigan qo‘shimcha narsalar o‘rnatilgan yoki qoplamalar surtilgan transport vositalaridan foydalanish, bundan oynalar tusini o‘zgartirish (qoraytirish) uchun tegishli ruxsatnoma berilgan transport vositalari mustasno, —
bazaviy hisoblash miqdorining yigirma besh baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Техник регламентга мувофиқ бўлмаган кўзгусимон ва (ёки) туси ўзгартирилган (қорайтирилган) ойнали транспорт воситаларидан, худди шунингдек ҳайдовчининг ўрнидан теварак-атрофни кўришни чеклайдиган қўшимча нарсалар ўрнатилган ёки қопламалар суртилган транспорт воситаларидан фойдаланиш, бундан ойналар тусини ўзгартириш (қорайтириш) учун тегишли рухсатнома берилган транспорт воситалари мустасно, —
базавий ҳисоблаш миқдорининг йигирма беш баравари миқдорида жарима солишга сабаб бўлади.',
  'Эксплуатация транспортных средств с зеркальными и (или) тонированными (затемненными) стеклами, не соответствующими техническому регламенту, а равно транспортных средств, на которых установлены дополнительные предметы или нанесены покрытия, ограничивающие обзорность с места водителя, за исключением транспортных средств, для тонирования (затемнения) стекол которых выдано соответствующее разрешение, —
влечет наложение штрафа в сумме двадцати пяти базовых расчетных величин.',
  25,
  NULL,
  15,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '126-modda 2-band',
  'Xuddi shunday huquqbuzarlik ma’muriy jazo chorasi qo‘llanilganidan keyin bir yil davomida takror sodir etilgan bo‘lsa, —
bazaviy hisoblash miqdorining qirq baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Худди шундай ҳуқуқбузарлик маъмурий жазо чораси қўлланилганидан кейин бир йил давомида такрор содир этилган бўлса, —
базавий ҳисоблаш миқдорининг қирқ баравари миқдорида жарима солишга сабаб бўлади.',
  'То же правонарушение, совершенное повторно в течение года после применения административного взыскания, —
влечет наложение штрафа в сумме сорока базовых расчетных величин.',
  40,
  NULL,
  16,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '127-modda 1-band',
  'Tovush signalini sababsiz berish, transport vositalariga uni ishlab chiqargan korxona nazarda tutmagan tovush chiqaruvchi va yorituvchi qurilmalarni o‘rnatish, xuddi shuningdek ularni o‘zgartirib o‘rnatish —
bazaviy hisoblash miqdorining uch baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Товуш сигналини сабабсиз бериш, транспорт воситаларига уни ишлаб чиқарган корхона назарда тутмаган товуш чиқарувчи ва ёритувчи қурилмаларни ўрнатиш, худди шунингдек уларни ўзгартириб ўрнатиш —
базавий ҳисоблаш миқдорининг уч баравари миқдорида жарима солишга сабаб бўлади.',
  'Бесцельная подача звукового сигнала, установка в транспортных средствах звуковых и световых устройств, не предусмотренных предприятием-изготовителем, а равно их переустройство —
влечет наложение штрафа в сумме трех базовых расчетных величин.',
  3,
  NULL,
  17,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '127-modda 2-band',
  'Tegishli ruxsat olmay turib transport vositalariga tovush chiqaruvchi va yorituvchi maxsus qurilmalarni o‘rnatish, xuddi shuningdek davlat raqam belgilarini ko‘rish imkoniyatini cheklaydigan, ularni anglashga to‘sqinlik qiladigan turli ashyolar o‘rnatish va qoplama surtish —
ana shu qurilmalarni musodara qilib, fuqarolarga bazaviy hisoblash miqdorining bir baravaridan uch baravarigacha, mansabdor shaxslarga esa — uch baravaridan besh baravarigacha miqdorda jarima solishga sabab bo‘ladi.',
  'Тегишли рухсат олмай туриб транспорт воситаларига товуш чиқарувчи ва ёритувчи махсус қурилмаларни ўрнатиш, худди шунингдек давлат рақам белгиларини кўриш имкониятини чеклайдиган, уларни англашга тўсқинлик қиладиган турли ашёлар ўрнатиш ва қоплама суртиш —
ана шу қурилмаларни мусодара қилиб, фуқароларга базавий ҳисоблаш миқдорининг бир бараваридан уч бараваригача, мансабдор шахсларга эса — уч бараваридан беш бараваригача миқдорда жарима солишга сабаб бўлади.',
  'Установка в транспортных средствах без соответствующего разрешения специальных звуковых и световых устройств, а равно установка различных предметов и нанесение покрытий, ограничивающих обзорность государственных номерных знаков, препятствующих правильному их восприятию —
влечет наложение штрафа на граждан от одной до трех, а на должностных лиц — от трех до пяти базовых расчетных величин с конфискацией этих устройств.',
  1,
  3,
  18,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '128-modda 1-band',
  'Haydovchilarning transport vositalarini trotuarlardan, piyodalar yo‘lkalaridan, velosiped yo‘lkalaridan, piyodalar va velosiped yo‘lkalaridan, ularga tutash hududlarda barpo etilgan yashil maydonlardan (bundan maxsus avtotransport vositalari mustasno) yurgizishi, yo‘l belgilari yoki yo‘lning qatnov qismidagi chiziqlar bilan belgilab qo‘yilgan talablarga rioya etmasligi (bundan ushbu Kodeksning 1283-moddasida, 1284-moddasining birinchi qismida, 1285, 1286, 1287 va 130-moddalarida nazarda tutilgan hollar mustasno), yuk avtomobillarida yo‘lning chetki chap qatorida harakatlanishi (bundan ruxsat etilgan hollar mustasno), yo‘nalishli transport vositalari to‘xtaydigan bekatlardan yoki piyodalar o‘tish joylaridan yurish, tashqi yoritish asboblaridan foydalanish qoidalarini buzishi, xuddi shuningdek yo‘lovchilarga yoki piyodalarga loyqa sachratishi
bazaviy hisoblash miqdorining bir baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Ҳайдовчиларнинг транспорт воситаларини тротуарлардан, пиёдалар йўлкаларидан, велосипед йўлкаларидан, пиёдалар ва велосипед йўлкаларидан, уларга туташ ҳудудларда барпо этилган яшил майдонлардан (бундан махсус автотранспорт воситалари мустасно) юргизиши, йўл белгилари ёки йўлнинг қатнов қисмидаги чизиқлар билан белгилаб қўйилган талабларга риоя этмаслиги (бундан ушбу Кодекснинг 1283-моддасида, 1284-моддасининг биринчи қисмида, 1285, 1286, 1287 ва 130-моддаларида назарда тутилган ҳоллар мустасно), юк автомобилларида йўлнинг четки чап қаторида ҳаракатланиши (бундан рухсат этилган ҳоллар мустасно), йўналишли транспорт воситалари тўхтайдиган бекатлардан ёки пиёдалар ўтиш жойларидан юриш, ташқи ёритиш асбобларидан фойдаланиш қоидаларини бузиши, худди шунингдек йўловчиларга ёки пиёдаларга лойқа сачратиши
базавий ҳисоблаш миқдорининг бир баравари миқдорида жарима солишга сабаб бўлади.',
  'Вождение водителями транспортных средств по тротуарам, пешеходным дорожкам, велосипедным дорожкам, пешеходным и велосипедным дорожкам, созданным на прилегающих к ним территориях зеленым площадям (за исключением специальных автотранспортных средств), несоблюдение ими требований, предписанных дорожными знаками или разметкой проезжей части дороги (за исключением случаев, предусмотренных статьей 1283, частью первой статьи 1284, статьями 1285, 1286, 1287 и 130 настоящего Кодекса), движение грузовых автомобилей по крайней левой полосе дороги (за исключением разрешенных случаев), нарушение правил проезда остановок маршрутных транспортных средств или пешеходных переходов, пользования внешними световыми приборами, а равно забрызгивание грязью пассажиров или пешеходов
влечет наложение штрафа в сумме одной базовой расчетной величины.',
  1,
  NULL,
  19,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '1-modda 1-band',
  'Transport vositasini boshqarish vaqtida haydovchilarning telefondan foydalanishi (bundan telefondan quloqchinlar orqali va qo‘llarni ishlatmasdan turib so‘zlashuvlar olib borish imkoniyatini beradigan boshqa uskunalar orqali foydalanish mustasno), —
bazaviy hisoblash miqdorining uch baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситасини бошқариш вақтида ҳайдовчиларнинг телефондан фойдаланиши (бундан телефондан қулоқчинлар орқали ва қўлларни ишлатмасдан туриб сўзлашувлар олиб бориш имкониятини берадиган бошқа ускуналар орқали фойдаланиш мустасно), —
базавий ҳисоблаш миқдорининг уч баравари миқдорида жарима солишга сабаб бўлади.',
  'Пользование водителями телефоном во время управления транспортным средством (за исключением пользования телефоном через наушники и другие устройства, позволяющие вести переговоры без использования рук) —
влечет наложение штрафа в сумме трех базовых расчетных величин.',
  3,
  NULL,
  20,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '2-modda 1-band',
  'Transport vositasini boshqarish vaqtida tele-, videodasturlarni tomosha qilish maqsadida transport vositasi salonining old qismiga o‘rnatilgan monitordan (displeydan) foydalanish, —
bazaviy hisoblash miqdorining bir baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситасини бошқариш вақтида теле-, видеодастурларни томоша қилиш мақсадида транспорт воситаси салонининг олд қисмига ўрнатилган монитордан (дисплейдан) фойдаланиш, —
базавий ҳисоблаш миқдорининг бир баравари миқдорида жарима солишга сабаб бўлади.',
  'Пользование во время управления транспортным средством монитором (дисплеем), установленным в передней части салона транспортного средства, в целях просмотра теле-, видеопрограмм —
влечет наложение штрафа в сумме одной базовой расчетной величины.',
  1,
  NULL,
  21,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '3-modda 1-band',
  'Transport vositalari haydovchilarining belgilangan harakat tezligini soatiga 20 kilometrdan ko‘p bo‘lmagan kattalikda oshirib yuborishi, —
bazaviy hisoblash miqdorining bir baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситалари ҳайдовчиларининг белгиланган ҳаракат тезлигини соатига 20 километрдан кўп бўлмаган катталикда ошириб юбориши, —
базавий ҳисоблаш миқдорининг бир баравари миқдорида жарима солишга сабаб бўлади.',
  'Превышение водителями транспортных средств установленной скорости движения на величину не более 20 километров в час —
влечет наложение штрафа в сумме одной базовой расчетной величины.',
  1,
  NULL,
  22,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '3-modda 2-band',
  'Transport vositalari haydovchilarining belgilangan harakat tezligini soatiga 20 kilometrdan ortiq, lekin 40 kilometrdan ko‘p bo‘lmagan kattalikda oshirib yuborishi, —
bazaviy hisoblash miqdorining besh baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситалари ҳайдовчиларининг белгиланган ҳаракат тезлигини соатига 20 километрдан ортиқ, лекин 40 километрдан кўп бўлмаган катталикда ошириб юбориши, —
базавий ҳисоблаш миқдорининг беш баравари миқдорида жарима солишга сабаб бўлади.',
  'Превышение водителями транспортных средств установленной скорости движения на величину более 20, но не более 40 километров в час —
влечет наложение штрафа в сумме пяти базовых расчетных величин.',
  5,
  NULL,
  23,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '3-modda 3-band',
  'Transport vositalari haydovchilarining belgilangan harakat tezligini soatiga 40 kilometrdan ortiq, lekin 60 kilometrdan ko‘p bo‘lmagan kattalikda oshirib yuborishi, —
bazaviy hisoblash miqdorining to‘qqiz baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситалари ҳайдовчиларининг белгиланган ҳаракат тезлигини соатига 40 километрдан ортиқ, лекин 60 километрдан кўп бўлмаган катталикда ошириб юбориши, —
базавий ҳисоблаш миқдорининг тўққиз баравари миқдорида жарима солишга сабаб бўлади.',
  'Превышение водителями транспортных средств установленной скорости движения на величину более 40 километров, но не более 60 километров в час —
влечет наложение штрафа в сумме девяти базовых расчетных величин.',
  9,
  NULL,
  24,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '3-modda 4-band',
  'Transport vositalari haydovchilarining belgilangan harakat tezligini soatiga 60 kilometrdan ortiq kattalikda oshirib yuborishi, —
bazaviy hisoblash miqdorining o‘n besh baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситалари ҳайдовчиларининг белгиланган ҳаракат тезлигини соатига 60 километрдан ортиқ катталикда ошириб юбориши, —
базавий ҳисоблаш миқдорининг ўн беш баравари миқдорида жарима солишга сабаб бўлади.',
  'Превышение водителями транспортных средств установленной скорости движения на величину более 60 километров в час —
влечет наложение штрафа в сумме пятнадцати базовых расчетных величин.',
  15,
  NULL,
  25,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '4-modda 1-band',
  'Svetoforning taqiqlovchi signalida yoki yo‘l harakatini tartibga soluvchining taqiqlovchi ishorasida yo‘lning qatnov qismidagi yo‘l chiziqlari yoki yo‘l belgilari bilan belgilangan to‘xtash chizig‘ini bosib kirish, —
bazaviy hisoblash miqdorining ikkidan bir baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Светофорнинг тақиқловчи сигналида ёки йўл ҳаракатини тартибга солувчининг тақиқловчи ишорасида йўлнинг қатнов қисмидаги йўл чизиқлари ёки йўл белгилари билан белгиланган тўхташ чизиғини босиб кириш, —
базавий ҳисоблаш миқдорининг иккидан бир баравари миқдорида жарима солишга сабаб бўлади.',
  'Въезд на стоп-линию, обозначенную дорожными знаками или разметкой проезжей части дороги, при запрещающем сигнале светофора или запрещающем жесте регулировщика дорожного движения —
влечет наложение штрафа в сумме одной второй базовой расчетной величины.',
  0.5,
  NULL,
  26,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '4-modda 2-band',
  'Transport vositalari haydovchilarining svetoforning taqiqlovchi signaliga yoki yo‘l harakatini tartibga soluvchining taqiqlovchi ishorasiga bo‘ysunmasdan o‘tishi, —
bazaviy hisoblash miqdorining uch baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситалари ҳайдовчиларининг светофорнинг тақиқловчи сигналига ёки йўл ҳаракатини тартибга солувчининг тақиқловчи ишорасига бўйсунмасдан ўтиши, —
базавий ҳисоблаш миқдорининг уч баравари миқдорида жарима солишга сабаб бўлади.',
  'Проезд водителями транспортных средств на запрещающий сигнал светофора или на запрещающий жест регулировщика дорожного движения —
влечет наложение штрафа в сумме трех базовых расчетных величин.',
  3,
  NULL,
  27,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '5-modda 1-band',
  'Tezkor va maxsus xizmatlarning ko‘k yoki qizil yoxud ko‘k va qizil rangli yaltiroq mayoqchani yoqqan holda hamda maxsus tovushli signal bilan yaqinlashib kelayotgan transport vositalari to‘siqsiz o‘tib ketishi uchun transport vositalari haydovchilari tomonidan xalaqit berish, —
bazaviy hisoblash miqdorining besh baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Тезкор ва махсус хизматларнинг кўк ёки қизил ёхуд кўк ва қизил рангли ялтироқ маёқчани ёққан ҳолда ҳамда махсус товушли сигнал билан яқинлашиб келаётган транспорт воситалари тўсиқсиз ўтиб кетиши учун транспорт воситалари ҳайдовчилари томонидан халақит бериш, —
базавий ҳисоблаш миқдорининг беш баравари миқдорида жарима солишга сабаб бўлади.',
  'Создание водителями транспортных средств помехи для беспрепятственного проезда транспортных средств оперативных и специальных служб, приближающихся с включенными проблесковым маячком синего или красного либо синего и красного цветов и специальным звуковым сигналом, —
влечет наложение штрафа в сумме пяти базовых расчетных величин.',
  5,
  NULL,
  28,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '5-modda 2-band',
  'Transport vositalari haydovchilarining yo‘lning qarama-qarshi harakatlanish uchun mo‘ljallangan tomoniga yoki bo‘lagiga yo‘l harakati qoidalarini buzgan holda chiqishi, xuddi shuningdek avariya holati yuzaga kelishiga sabab bo‘lgan, ya’ni yo‘l harakatining boshqa qatnashchilarini tezlikni, harakat yo‘nalishini keskin o‘zgartirishga yoki o‘z xavfsizligini yoxud boshqa fuqarolarning xavfsizligini ta’minlash uchun o‘zga choralarni ko‘rishga majbur qiluvchi huquqbuzarlikni sodir etishi, —
bazaviy hisoblash miqdorining o‘n baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситалари ҳайдовчиларининг йўлнинг қарама-қарши ҳаракатланиш учун мўлжалланган томонига ёки бўлагига йўл ҳаракати қоидаларини бузган ҳолда чиқиши, худди шунингдек авария ҳолати юзага келишига сабаб бўлган, яъни йўл ҳаракатининг бошқа қатнашчиларини тезликни, ҳаракат йўналишини кескин ўзгартиришга ёки ўз хавфсизлигини ёхуд бошқа фуқароларнинг хавфсизлигини таъминлаш учун ўзга чораларни кўришга мажбур қилувчи ҳуқуқбузарликни содир этиши, —
базавий ҳисоблаш миқдорининг ўн баравари миқдорида жарима солишга сабаб бўлади.',
  'Выезд водителями транспортных средств в нарушение правил дорожного движения на сторону дороги или полосу, предназначенную для встречного движения, а равно совершение ими правонарушения, повлекшего создание аварийной ситуации, то есть вынудившего других участников дорожного движения резко изменить скорость, направление движения или принять иные меры к обеспечению собственной безопасности либо безопасности других граждан, —
влечет наложение штрафа в сумме десяти базовых расчетных величин.',
  10,
  NULL,
  29,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '6-modda 1-band',
  'Transport vositalari haydovchilarining to‘xtash yoki to‘xtab turish qoidalarini buzishi, —
bazaviy hisoblash miqdorining ikki baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситалари ҳайдовчиларининг тўхташ ёки тўхтаб туриш қоидаларини бузиши, —
базавий ҳисоблаш миқдорининг икки баравари миқдорида жарима солишга сабаб бўлади.',
  'Нарушение водителями транспортных средств правил остановки или стоянки —
влечет наложение штрафа в сумме двух базовых расчетных величин.',
  2,
  NULL,
  30,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '7-modda 1-band',
  'Yo‘nalishli transport vositalari uchun alohida ajratilgan tasmasi bor yo‘ldan transport vositalarining harakatlanishi (bundan ruxsat etilgan hollar mustasno), —
bazaviy hisoblash miqdorining bir baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Йўналишли транспорт воситалари учун алоҳида ажратилган тасмаси бор йўлдан транспорт воситаларининг ҳаракатланиши (бундан рухсат этилган ҳоллар мустасно), —
базавий ҳисоблаш миқдорининг бир баравари миқдорида жарима солишга сабаб бўлади.',
  'Движение транспортных средств по дороге с отдельно выделенной полосой для маршрутных транспортных средств (за исключением разрешенных случаев) —
влечет наложение штрафа в сумме одной базовой расчетной величины.',
  1,
  NULL,
  31,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '7-modda 2-band',
  'Ushbu moddaning birinchi qismida nazarda tutilgan xuddi shunday huquqbuzarlikni ma’muriy jazo qo‘llanilganidan keyin bir yil davomida takror sodir etish, —
bazaviy hisoblash miqdorining uch baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Ушбу модданинг биринчи қисмида назарда тутилган худди шундай ҳуқуқбузарликни маъмурий жазо қўлланилганидан кейин бир йил давомида такрор содир этиш, —
базавий ҳисоблаш миқдорининг уч баравари миқдорида жарима солишга сабаб бўлади.',
  'Совершение одного и того же правонарушения, предусмотренного в части первой настоящей статьи, повторно в течение года после применения административного взыскания —
влечет наложение штрафа в сумме трех базовых расчетных величин.',
  3,
  NULL,
  32,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '8-modda 1-band',
  'Odam tashish qoidalarini buzish, —
bazaviy hisoblash miqdorining ikki baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Одам ташиш қоидаларини бузиш, —
базавий ҳисоблаш миқдорининг икки баравари миқдорида жарима солишга сабаб бўлади.',
  'Нарушение правил перевозки людей —
влечет наложение штрафа в сумме двух базовых расчетных величин.',
  2,
  NULL,
  33,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '8-modda 2-band',
  'Avtobus va mikroavtobuslarda ichki ishlar organlarining hamrohligisiz odam tashish, agar ularning hamrohligida odam tashish shart bo‘lsa, —
bazaviy hisoblash miqdorining besh baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Автобус ва микроавтобусларда ички ишлар органларининг ҳамроҳлигисиз одам ташиш, агар уларнинг ҳамроҳлигида одам ташиш шарт бўлса, —
базавий ҳисоблаш миқдорининг беш баравари миқдорида жарима солишга сабаб бўлади.',
  'Перевозка людей в автобусах и микроавтобусах без сопровождения органов внутренних дел, если перевозка людей в их сопровождении является обязательной —
влечет наложение штрафа в сумме пяти базовых расчетных величин.',
  5,
  NULL,
  34,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '9-modda 1-band',
  'Transport vositalarini quvib o‘tish qoidalarini buzish, —
bazaviy hisoblash miqdorining uch baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситаларини қувиб ўтиш қоидаларини бузиш, —
базавий ҳисоблаш миқдорининг уч баравари миқдорида жарима солишга сабаб бўлади.',
  'Нарушение правил обгона транспортных средств —
влечет наложение штрафа в сумме трех базовых расчетных величин.',
  3,
  NULL,
  35,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '10-modda 1-band',
  'Yo‘l bezoriligi, ya’ni transport vositalari haydovchilarining boshqa transport vositalarining harakatiga qasddan to‘sqinlik qilishi, harakatlanish burchagini va (yoki) tezligini saqlagan holda transport vositasini sababsiz sirpantirishi (drift), o‘z yo‘nalishida harakatlanish bo‘lagini sababsiz keskin ravishda uch va undan ortiq marta uzluksiz o‘zgartirishi (bundan maxsus ajratilgan joylarda sodir etish mustasno) yoki yo‘l harakati ishtirokchilarining xavfsiz harakatlanishiga tahdid soluvchi yoxud transport vositasida yo‘l harakatining boshqa ishtirokchilariga nisbatan hurmatsizlikda ifodalangan boshqa xatti-harakatlarni namoyishkorona sodir etishi, —
transport vositalarini boshqarish huquqidan bir yildan ikki yilgacha muddatga mahrum qilib, bazaviy hisoblash miqdorining yigirma besh baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Йўл безорилиги, яъни транспорт воситалари ҳайдовчиларининг бошқа транспорт воситаларининг ҳаракатига қасддан тўсқинлик қилиши, ҳаракатланиш бурчагини ва (ёки) тезлигини сақлаган ҳолда транспорт воситасини сабабсиз сирпантириши (дрифт), ўз йўналишида ҳаракатланиш бўлагини сабабсиз кескин равишда уч ва ундан ортиқ марта узлуксиз ўзгартириши (бундан махсус ажратилган жойларда содир этиш мустасно) ёки йўл ҳаракати иштирокчиларининг хавфсиз ҳаракатланишига таҳдид солувчи ёхуд транспорт воситасида йўл ҳаракатининг бошқа иштирокчиларига нисбатан ҳурматсизликда ифодаланган бошқа хатти-ҳаракатларни намойишкорона содир этиши, —
транспорт воситаларини бошқариш ҳуқуқидан бир йилдан икки йилгача муддатга маҳрум қилиб, базавий ҳисоблаш миқдорининг йигирма беш баравари миқдорида жарима солишга сабаб бўлади.',
  'Дорожное хулиганство, то есть умышленное создание водителями транспортных средств препятствий движению других транспортных средств, необоснованное буксование (дрифт) транспортным средством при сохранении угла и (или) скорости движения, резкое изменение без причины проезжей части в своем направлении непрерывно три и более раза (за исключением совершения в специально отведенных участках) или демонстративное совершение иных действий на транспортном средстве, угрожающих безопасному передвижению участников дорожного движения либо проявляющих неуважение к другим участникам дорожного движения, —
влечет наложение штрафа в сумме двадцати пяти базовых расчетных величин с лишением права управления транспортными средствами сроком от одно года до двух лет.',
  25,
  NULL,
  36,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '10-modda 2-band',
  'Xuddi shunday huquqbuzarlik transport vositalarini boshqarish huquqi bo‘lmagan yoki transport vositalarini boshqarish huquqidan mahrum etilgan shaxs tomonidan sodir etilgan bo‘lsa, —
bazaviy hisoblash miqdorining ellik baravari miqdorida jarima solishga yoki o‘n besh sutka muddatga ma’muriy qamoqqa olishga sabab bo‘ladi.',
  'Худди шундай ҳуқуқбузарлик транспорт воситаларини бошқариш ҳуқуқи бўлмаган ёки транспорт воситаларини бошқариш ҳуқуқидан маҳрум этилган шахс томонидан содир этилган бўлса, —
базавий ҳисоблаш миқдорининг эллик баравари миқдорида жарима солишга ёки ўн беш сутка муддатга маъмурий қамоққа олишга сабаб бўлади.',
  'То же правонарушение, совершенное лицом, не имеющим права управления транспортными средствами или лишенным права управления транспортными средствами, —
влечет наложение штрафа в сумме пятидесяти базовых расчетных величин или административный арест на пятнадцать суток.',
  50,
  NULL,
  37,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '129-modda 1-band',
  'Transport vositalari haydovchilarining yo‘l harakati xavfsizligiga tahdid soluvchi yoki avariya holatini keltirib chiqaruvchi guruh bo‘lib harakat qilishda qatnashishi, —
bazaviy hisoblash miqdorining besh baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситалари ҳайдовчиларининг йўл ҳаракати хавфсизлигига таҳдид солувчи ёки авария ҳолатини келтириб чиқарувчи гуруҳ бўлиб ҳаракат қилишда қатнашиши, —
базавий ҳисоблаш миқдорининг беш баравари миқдорида жарима солишга сабаб бўлади.',
  'Участие водителей транспортных средств в групповой езде, угрожающей безопасности дорожного движения или повлекшей аварийную ситуацию, —
влечет наложение штрафа в размере пяти базовых расчетных величин.',
  5,
  NULL,
  38,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '130-modda 1-band',
  'Transport vositalari haydovchilarining temir yo‘lning o‘tish joylaridan o‘tish qoidalarini buzishi —
bazaviy hisoblash miqdorining besh baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситалари ҳайдовчиларининг темир йўлнинг ўтиш жойларидан ўтиш қоидаларини бузиши —
базавий ҳисоблаш миқдорининг беш баравари миқдорида жарима солишга сабаб бўлади.',
  'Нарушение водителями транспортных средств правил проезда железнодорожных переездов —
влечет наложение штрафа в сумме пяти базовых расчетных величин.',
  5,
  NULL,
  39,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '131-modda 1-band',
  'Haydovchilarning transport vositalarini alkogolli ichimlikdan mastlik holatida yoki giyohvandlik vositalari, ularning analoglari, psixotrop yoki shaxsning aql-idrokiga ta’sir ko‘rsatuvchi boshqa moddalar ta’siri ostida boshqarishi, —
transport vositalarini boshqarish huquqidan uch yil muddatga mahrum qilib, bazaviy hisoblash miqdorining qirq baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Ҳайдовчиларнинг транспорт воситаларини алкоголли ичимликдан мастлик ҳолатида ёки гиёҳвандлик воситалари, уларнинг аналоглари, психотроп ёки шахснинг ақл-идрокига таъсир кўрсатувчи бошқа моддалар таъсири остида бошқариши, —
транспорт воситаларини бошқариш ҳуқуқидан уч йил муддатга маҳрум қилиб, базавий ҳисоблаш миқдорининг қирқ баравари миқдорида жарима солишга сабаб бўлади.',
  'Управление транспортными средствами водителями в состоянии алкогольного опьянения или под воздействием наркотических средств, их аналогов, психотропных или иных веществ, влияющих на интеллектуально-волевую деятельность лица, —
влечет наложение штрафа в сумме сорока базовых расчетных величин с лишением права управления транспортными средствами сроком на три года.',
  40,
  NULL,
  40,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '131-modda 2-band',
  'Xuddi shunday huquqbuzarlik transport vositalarini boshqarish huquqi bo‘lmagan shaxs tomonidan sodir etilgan bo‘lsa, —
bazaviy hisoblash miqdorining ellik baravari miqdorida jarima solishga yoki o‘n besh sutka muddatga ma’muriy qamoqqa olishga sabab bo‘ladi.',
  'Худди шундай ҳуқуқбузарлик транспорт воситаларини бошқариш ҳуқуқи бўлмаган шахс томонидан содир этилган бўлса, —
базавий ҳисоблаш миқдорининг эллик баравари миқдорида жарима солишга ёки ўн беш сутка муддатга маъмурий қамоққа олишга сабаб бўлади.',
  'То же правонарушение, совершенное лицом, не имеющим права управления транспортными средствами, —
влечет наложение штрафа в сумме пятидесяти базовых расчетных величин или административный арест на пятнадцать суток.',
  50,
  NULL,
  41,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '133-modda 1-band',
  'Transport vositalari haydovchilarining yo‘l harakati qoidalarini buzishi jabrlanuvchiga yengil tan jarohati yoki ancha miqdorda moddiy zarar yetkazilishiga olib kelsa, bundan jabrlanuvchiga yengil tan jarohati yetkazilishiga olib kelmagan yo‘l-transport hodisasi sodir etilganda yo‘l-transport hodisasida ishtirok etgan haydovchilar tomonidan yo‘l-transport hodisasi to‘g‘risida xabarnoma tuzilgan hollar mustasno. (Ancha miqdordagi moddiy zarar deganda, bazaviy hisoblash miqdorining besh baravari miqdoridan oshib ketgan zarar tushuniladi.) —
bazaviy hisoblash miqdorining besh baravaridan yetti baravarigacha miqdorda jarima solishga yoki transport vositalarini boshqarish huquqidan bir yildan uch yilgacha muddatga mahrum etishga sabab bo‘ladi.',
  'Транспорт воситалари ҳайдовчиларининг йўл ҳаракати қоидаларини бузиши жабрланувчига енгил тан жароҳати ёки анча миқдорда моддий зарар етказилишига олиб келса, бундан жабрланувчига енгил тан жароҳати етказилишига олиб келмаган йўл-транспорт ҳодисаси содир этилганда йўл-транспорт ҳодисасида иштирок этган ҳайдовчилар томонидан йўл-транспорт ҳодисаси тўғрисида хабарнома тузилган ҳоллар мустасно. (Анча миқдордаги моддий зарар деганда, базавий ҳисоблаш миқдорининг беш баравари миқдоридан ошиб кетган зарар тушунилади.) —
базавий ҳисоблаш миқдорининг беш бараваридан етти бараваригача миқдорда жарима солишга ёки транспорт воситаларини бошқариш ҳуқуқидан бир йилдан уч йилгача муддатга маҳрум этишга сабаб бўлади.',
  'Нарушение водителями транспортных средств правил дорожного движения, повлекшее причинение потерпевшему легкого телесного повреждения либо существенного материального ущерба, за исключением случаев, когда при совершении дорожно-транспортного происшествия, не повлекшего причинения потерпевшему легкого телесного повреждения, водителями, участвовавшими в дорожно-транспортном происшествии, составлено извещение о дорожно-транспортном происшествии (Под существенным материальным ущербом понимается ущерб, превышающий пять базовых расчетных величин.)—
влечет наложение штрафа от пяти до семи базовых расчетных величин или лишение права управления транспортными средствами от одного до трех лет.',
  5,
  7,
  42,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '134-modda 1-band',
  'Transport vositalari haydovchilarining yo‘l harakati qoidalarini buzishi transport vositalari, yo‘l harakatini tartibga soluvchi vositalar yoki boshqa mol-mulk shikastlanishiga olib kelsa, lekin ancha miqdorda moddiy zarar yetkazmasa, bundan yo‘l harakatini tartibga soluvchi vositalar yoki boshqa mol-mulk shikastlanishiga olib kelmagan yo‘l-transport hodisasi sodir etilganda yo‘l-transport hodisasida ishtirok etgan haydovchilar tomonidan yo‘l-transport hodisasi to‘g‘risida xabarnoma tuzilgan hollar mustasno —
bazaviy hisoblash miqdorining ikki baravaridan to‘rt baravarigacha miqdorda jarima solishga yoki transport vositasini boshqarish huquqidan olti oydan bir yilgacha muddatga mahrum etishga sabab bo‘ladi.',
  'Транспорт воситалари ҳайдовчиларининг йўл ҳаракати қоидаларини бузиши транспорт воситалари, йўл ҳаракатини тартибга солувчи воситалар ёки бошқа мол-мулк шикастланишига олиб келса, лекин анча миқдорда моддий зарар етказмаса, бундан йўл ҳаракатини тартибга солувчи воситалар ёки бошқа мол-мулк шикастланишига олиб келмаган йўл-транспорт ҳодисаси содир этилганда йўл-транспорт ҳодисасида иштирок этган ҳайдовчилар томонидан йўл-транспорт ҳодисаси тўғрисида хабарнома тузилган ҳоллар мустасно —
базавий ҳисоблаш миқдорининг икки бараваридан тўрт бараваригача миқдорда жарима солишга ёки транспорт воситасини бошқариш ҳуқуқидан олти ойдан бир йилгача муддатга маҳрум этишга сабаб бўлади.',
  'Нарушение водителями транспортных средств правил дорожного движения, повлекшее повреждение транспортных средств, средств регулирования дорожного движения или иного имущества, не причинившее существенного материального ущерба, за исключением случаев, когда при совершении дорожно-транспортного происшествия, не повлекшего повреждение средств регулирования дорожного движения или иного имущества, водителями, участвовавшими в дорожно-транспортном происшествии, составлено извещение о дорожно-транспортном происшествии —
влечет наложение штрафа от двух до четырех базовых расчетных величин или лишение права управления транспортными средствами от шести месяцев до одного года.',
  2,
  4,
  43,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '135-modda 1-band',
  'Transport vositalarini boshqarish huquqini beruvchi hujjatlari, transport vositasi ro‘yxatdan o‘tkazilganligi to‘g‘risidagi, shuningdek transport vositasiga egalik qilish, egasi yo‘qligida undan foydalanish yoki uni tasarruf etish huquqini tasdiqlovchi hujjatlari, transport vositalari egalarining fuqarolik javobgarligini majburiy sug‘urta qilish bo‘yicha sug‘urta polisi, oynalar tusini o‘zgartirish (qoraytirish) uchun tegishli ruxsatnomasi, O‘zbekiston Respublikasi hududiga chet eldan olib kirilgan transport vositasi uchun bojxona organlari tomonidan berilgan hujjatlari, qonunchilikda nazarda tutilgan hollarda esa litsenziya kartochkasi yoki yo‘l varaqasi, yuridik shaxslarning transport vositalari haydovchilar uchun, shu jumladan yo‘lovchi yoki yuk tashish faoliyatini amalga oshiruvchi haydovchilar uchun malaka oshirishdan o‘tganligi to‘g‘risidagi sertifikati (bundan transport vositalarini boshqarish huquqini beruvchi guvohnomani almashtirish yoki yo‘qolgan guvohnoma o‘rniga boshqasini berish hollarini istisno qilgan holda, guvohnoma olingan paytdan e’tiboran ikki yillik davr mustasno) yonida bo‘lmagan holda, xuddi shuningdek transport vositalarini olib kirganligini tasdiqlovchi bojxona organlari tomonidan berilgan tegishli belgilar qo‘yilgan hujjatlarining muddati o‘tgan haydovchilarning transport vositalarini boshqarishi, —
bazaviy hisoblash miqdorining bir baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситаларини бошқариш ҳуқуқини берувчи ҳужжатлари, транспорт воситаси рўйхатдан ўтказилганлиги тўғрисидаги, шунингдек транспорт воситасига эгалик қилиш, эгаси йўқлигида ундан фойдаланиш ёки уни тасарруф этиш ҳуқуқини тасдиқловчи ҳужжатлари, транспорт воситалари эгаларининг фуқаролик жавобгарлигини мажбурий суғурта қилиш бўйича суғурта полиси, ойналар тусини ўзгартириш (қорайтириш) учун тегишли рухсатномаси, Ўзбекистон Республикаси ҳудудига чет элдан олиб кирилган транспорт воситаси учун божхона органлари томонидан берилган ҳужжатлари, қонунчиликда назарда тутилган ҳолларда эса лицензия карточкаси ёки йўл варақаси, юридик шахсларнинг транспорт воситалари ҳайдовчилар учун, шу жумладан йўловчи ёки юк ташиш фаолиятини амалга оширувчи ҳайдовчилар учун малака оширишдан ўтганлиги тўғрисидаги сертификати (бундан транспорт воситаларини бошқариш ҳуқуқини берувчи гувоҳномани алмаштириш ёки йўқолган гувоҳнома ўрнига бошқасини бериш ҳолларини истисно қилган ҳолда, гувоҳнома олинган пайтдан эътиборан икки йиллик давр мустасно) ёнида бўлмаган ҳолда, худди шунингдек транспорт воситаларини олиб кирганлигини тасдиқловчи божхона органлари томонидан берилган тегишли белгилар қўйилган ҳужжатларининг муддати ўтган ҳайдовчиларнинг транспорт воситаларини бошқариши, —
базавий ҳисоблаш миқдорининг бир баравари миқдорида жарима солишга сабаб бўлади.',
  'Управление транспортными средствами водителями, не имеющими при себе документов на право управления ими, документов о регистрации транспортного средства, а также подтверждающих право владения, пользования или распоряжения транспортным средством в отсутствие его владельца, страхового полиса по обязательному страхованию гражданской ответственности владельцев транспортных средств, соответствующего разрешения на тонирование (затемнение) стекол, документов выданных таможенными органами на транспортное средство, ввезенное на территорию Республики Узбекистан из-за границы, а в случаях, предусмотренных законодательством, лицензионной карточки или путевого листа, сертификата о прохождении повышения квалификации для водителей транспортных средств юридических лиц, в том числе осуществляющих деятельность по перевозке пассажиров или грузов (за исключением двухгодичного периода с момента получения удостоверения на право управления транспортными средствами, кроме случаев его замены или выдачи вместо утерянного), а равно управление транспортными средствами по документам, выданным таможенными органами с соответствующей отметкой, подтверждающей ввоз транспортных средств, с истекшим сроком действия, —
влечет наложение штрафа в сумме одной базовой расчетной величины.',
  1,
  NULL,
  44,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '135-modda 2-band',
  'Transport vositalarini boshqarish huquqiga ega bo‘lmagan yoxud aynan shu transport vositalarini boshqarish huquqini beruvchi hujjatlari mavjud bo‘lmagan shaxslarning transport vositalarini boshqarishi, xuddi shuningdek transport vositalarini boshqarish huquqiga ega bo‘lmagan shaxsga transport vositalarini boshqarishning topshirilishi, —
bazaviy hisoblash miqdorining besh baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситаларини бошқариш ҳуқуқига эга бўлмаган ёхуд айнан шу транспорт воситаларини бошқариш ҳуқуқини берувчи ҳужжатлари мавжуд бўлмаган шахсларнинг транспорт воситаларини бошқариши, худди шунингдек транспорт воситаларини бошқариш ҳуқуқига эга бўлмаган шахсга транспорт воситаларини бошқаришнинг топширилиши, —
базавий ҳисоблаш миқдорининг беш баравари миқдорида жарима солишга сабаб бўлади.',
  'Управление транспортными средствами лицами, не имеющими права управления транспортными средствами или не имеющими документов, дающих им право управления именно этими транспортными средствами, а равно поручение управления транспортными средствами лицу, не имеющему права управления транспортными средствами, —
влечет наложение штрафа в сумме пяти базовых расчетных величин.',
  5,
  NULL,
  45,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '135-modda 3-band',
  'Transport vositalarini boshqarish huquqidan mahrum etilgan shaxslarning bunday vositalarni boshqarishi —
bazaviy hisoblash miqdorining ellik baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситаларини бошқариш ҳуқуқидан маҳрум этилган шахсларнинг бундай воситаларни бошқариши —
базавий ҳисоблаш миқдорининг эллик баравари миқдорида жарима солишга сабаб бўлади.',
  'Управление транспортными средствами лицами, лишенными этого права, —
влечет наложение штрафа в сумме пятидесяти базовых расчетных величин.',
  50,
  NULL,
  46,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '1-modda 1-band',
  'Transport vositalari egalarining fuqarolik javobgarligini majburiy sug‘urta qilish bo‘yicha sug‘urta polislarida nazarda tutilmagan foydalanish davrida transport vositalarini boshqarish, xuddi shuningdek faqat mazkur sug‘urta polislarida ko‘rsatilgan haydovchilar ayni shu transport vositalarini boshqarishi to‘g‘risida mazkur sug‘urta polislarida nazarda tutilgan shartlarni buzgan holda transport vositalarini boshqarish, —
bazaviy hisoblash miqdorining ikkidan bir qismi miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситалари эгаларининг фуқаролик жавобгарлигини мажбурий суғурта қилиш бўйича суғурта полисларида назарда тутилмаган фойдаланиш даврида транспорт воситаларини бошқариш, худди шунингдек фақат мазкур суғурта полисларида кўрсатилган ҳайдовчилар айни шу транспорт воситаларини бошқариши тўғрисида мазкур суғурта полисларида назарда тутилган шартларни бузган ҳолда транспорт воситаларини бошқариш, —
базавий ҳисоблаш миқдорининг иккидан бир қисми миқдорида жарима солишга сабаб бўлади.',
  'Управление транспортными средствами в период их использования, не предусмотренный страховыми полисами по обязательному страхованию гражданской ответственности владельцев транспортных средств, а равно управление транспортными средствами с нарушением предусмотренных данными страховыми полисами условий управления этими транспортными средствами только указанными в данных страховых полисах водителями —
влечет наложение штрафа в сумме одной второй базовой расчетной величины.',
  0.5,
  NULL,
  47,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '136-modda 1-band',
  'Transport vositalari haydovchilarining mastlik holatida yoki giyohvandlik vositalari, ularning analoglari, psixotrop yoki shaxsning aql-idrokiga ta’sir ko‘rsatuvchi boshqa moddalar ta’siri ostida ekanligini belgilangan tartibda aniqlash uchun tekshiruvdan o‘tishdan bo‘yin tovlashi, —
transport vositalarini boshqarish huquqidan uch yil muddatga mahrum qilib, bazaviy hisoblash miqdorining o‘ttiz baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситалари ҳайдовчиларининг мастлик ҳолатида ёки гиёҳвандлик воситалари, уларнинг аналоглари, психотроп ёки шахснинг ақл-идрокига таъсир кўрсатувчи бошқа моддалар таъсири остида эканлигини белгиланган тартибда аниқлаш учун текширувдан ўтишдан бўйин товлаши, —
транспорт воситаларини бошқариш ҳуқуқидан уч йил муддатга маҳрум қилиб, базавий ҳисоблаш миқдорининг ўттиз баравари миқдорида жарима солишга сабаб бўлади.',
  'Уклонение водителей транспортных средств от прохождения в соответствии с установленным порядком освидетельствования на состояние алкогольного опьянения или нахождения под воздействием наркотических средств, их аналогов, психотропных или иных веществ, влияющих на интеллектуально-волевую деятельность лица, —
влечет наложение штрафа в сумме тридцати базовых расчетных величин с лишением права управления транспортными средствами на три года.',
  30,
  NULL,
  48,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '136-modda 2-band',
  'Xuddi shunday huquqbuzarlik transport vositalarini boshqarish huquqiga ega bo‘lmagan shaxs tomonidan sodir etilgan bo‘lsa, —
bazaviy hisoblash miqdorining ellik baravari miqdorida jarima solishga yoki o‘n besh sutkagacha ma’muriy qamoqqa olishga sabab bo‘ladi.',
  'Худди шундай ҳуқуқбузарлик транспорт воситаларини бошқариш ҳуқуқига эга бўлмаган шахс томонидан содир этилган бўлса, —
базавий ҳисоблаш миқдорининг эллик баравари миқдорида жарима солишга ёки ўн беш суткагача маъмурий қамоққа олишга сабаб бўлади.',
  'То же правонарушение, совершенное лицом, не имеющим права управления транспортными средствами, —
влечет наложение штрафа в сумме пятидесяти базовых расчетных величин или административный арест до пятнадцати суток.',
  50,
  NULL,
  49,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '136-modda 3-band',
  'Ushbu moddaning birinchi qismida nazarda tutilgan huquqbuzarlikning skuterni, mopedni, velosipedni, individual harakatlanish vositasini, ulovli aravani boshqarib borayotgan shaxs tomonidan sodir etilishi, —
bazaviy hisoblash miqdorining uch baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Ушбу модданинг биринчи қисмида назарда тутилган ҳуқуқбузарликнинг скутерни, мопедни, велосипедни, индивидуал ҳаракатланиш воситасини, уловли аравани бошқариб бораётган шахс томонидан содир этилиши, —
базавий ҳисоблаш миқдорининг уч баравари миқдорида жарима солишга сабаб бўлади.',
  'Совершение правонарушения, предусмотренного в части первой настоящей статьи, лицом, управляющим скутером, мопедом, велосипедом, средством индивидуального передвижения, ведущим гужевую повозку, —
влечет наложение штрафа в сумме трех базовых расчетных величин.',
  3,
  NULL,
  50,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '137-modda 1-band',
  'Yo‘l-transport hodisasi qatnashchilarining belgilangan qoidalarni buzgan holda hodisa yuz bergan joydan ketib qolishi, —
bazaviy hisoblash miqdorining o‘n besh baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Йўл-транспорт ҳодисаси қатнашчиларининг белгиланган қоидаларни бузган ҳолда ҳодиса юз берган жойдан кетиб қолиши, —
базавий ҳисоблаш миқдорининг ўн беш баравари миқдорида жарима солишга сабаб бўлади.',
  'Оставление в нарушение установленных правил места дорожно-транспортного происшествия его участниками —
влечет наложение штрафа в сумме пятнадцати базовых расчетных величин.',
  15,
  NULL,
  51,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '137-modda 2-band',
  'Yo‘l-transport hodisasi qatnashchilarining belgilangan qoidalarni buzgan holda hodisa yuz bergan joydan ketib qolishi, agar ushbu yo‘l-transport hodisasi jabrlanuvchiga yengil tan jarohati yoki ancha miqdorda moddiy zarar yetkazilishiga olib kelgan bo‘lsa, —
bazaviy hisoblash miqdorining o‘ttiz baravari miqdorida jarima solishga yoki transport vositalarini boshqarish huquqidan uch yil muddatga mahrum etishga yoxud o‘n besh sutkagacha muddatga ma’muriy qamoqqa olishga sabab bo‘ladi.',
  'Йўл-транспорт ҳодисаси қатнашчиларининг белгиланган қоидаларни бузган ҳолда ҳодиса юз берган жойдан кетиб қолиши, агар ушбу йўл-транспорт ҳодисаси жабрланувчига енгил тан жароҳати ёки анча миқдорда моддий зарар етказилишига олиб келган бўлса, —
базавий ҳисоблаш миқдорининг ўттиз баравари миқдорида жарима солишга ёки транспорт воситаларини бошқариш ҳуқуқидан уч йил муддатга маҳрум этишга ёхуд ўн беш суткагача муддатга маъмурий қамоққа олишга сабаб бўлади.',
  'Оставление в нарушение установленных правил места дорожно-транспортного происшествия его участниками в случае, если данное дорожно-транспортное происшествие повлекло причинение потерпевшему легкого телесного повреждения либо существенного материального ущерба, —
влечет наложение штрафа в сумме тридцати базовых расчетных величин или лишение права управления транспортными средствами сроком на три год либо административный арест до пятнадцати суток.',
  30,
  NULL,
  52,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '138-modda 1-band',
  'Piyodalarning yo‘l harakatini tartibga soluvchi signallarga bo‘ysunmasligi, ularning yo‘lning harakat qismini belgilanmagan joylardan kesib o‘tishi, piyodalar yo‘lning qatnov qismida, shu jumladan piyodalar o‘tish joyida harakatlanayotganda telefondan foydalanishi, kitoblarni yoki davriy nashrlarni o‘qishi, videomateriallarni tomosha qilishi hamda audiomateriallarni eshitishi, shuningdek e’tiborni chalg‘itadigan boshqa elektron vositalardan foydalanishi, shuningdek skuterlar, mopedlar va velosipedlarni, individual harakatlanish vositalarini, ulovli aravani boshqarib borayotgan shaxslarning hamda yo‘ldan foydalanuvchi boshqa shaxslarning yo‘l harakatini tartibga soluvchi signallarga bo‘ysunmasligi, ustunlik beruvchi, taqiqlovchi yoki ko‘rsatma beruvchi yo‘l belgilari talablariga rioya etmasligi, —
bazaviy hisoblash miqdorining uchdan bir qismi miqdorida jarima solishga sabab bo‘ladi.',
  'Пиёдаларнинг йўл ҳаракатини тартибга солувчи сигналларга бўйсунмаслиги, уларнинг йўлнинг ҳаракат қисмини белгиланмаган жойлардан кесиб ўтиши, пиёдалар йўлнинг қатнов қисмида, шу жумладан пиёдалар ўтиш жойида ҳаракатланаётганда телефондан фойдаланиши, китобларни ёки даврий нашрларни ўқиши, видеоматериалларни томоша қилиши ҳамда аудиоматериалларни эшитиши, шунингдек эътиборни чалғитадиган бошқа электрон воситалардан фойдаланиши, шунингдек скутерлар, мопедлар ва велосипедларни, индивидуал ҳаракатланиш воситаларини, уловли аравани бошқариб бораётган шахсларнинг ҳамда йўлдан фойдаланувчи бошқа шахсларнинг йўл ҳаракатини тартибга солувчи сигналларга бўйсунмаслиги, устунлик берувчи, тақиқловчи ёки кўрсатма берувчи йўл белгилари талабларига риоя этмаслиги, —
базавий ҳисоблаш миқдорининг учдан бир қисми миқдорида жарима солишга сабаб бўлади.',
  'Неподчинение пешеходов сигналам регулирования дорожного движения, переход ими проезжей части в неустановленных местах, пользование телефоном, чтение книг или периодических изданий, просмотр видеоматериалов и прослушивание аудиоматериалов, а также пользование иными электронными средствами, отвлекающими внимание при движении пешеходов по проезжей части, в том числе и по пешеходному переходу, а также неподчинение сигналам регулирования дорожного движения, несоблюдение требований дорожных знаков приоритета, запрещающих или предписывающих дорожных знаков лицами, управляющими скутерами, мопедами и велосипедами, средствами индивидуального передвижения, ведущими гужевые повозки и другими лицами, пользующимися дорогами.
влечет наложение штрафа в сумме одной третьей базовой расчетной величины.',
  0.33,
  NULL,
  53,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '138-modda 2-band',
  'Haydovchilarga har xil xizmat ko‘rsatish maqsadida yo‘lning qatnov qismida fuqarolarning turishi, yo‘llarga ajratilgan mintaqa tegrasida mol boqish —
bazaviy hisoblash miqdorining ikkidan bir qismi miqdorida jarima solishga sabab bo‘ladi.',
  'Ҳайдовчиларга ҳар хил хизмат кўрсатиш мақсадида йўлнинг қатнов қисмида фуқароларнинг туриши, йўлларга ажратилган минтақа теграсида мол боқиш —
базавий ҳисоблаш миқдорининг иккидан бир қисми миқдорида жарима солишга сабаб бўлади.',
  'Нахождение граждан на проезжей части дорог с целью оказания различных услуг водителям, выпас скота в зоне полосы отвода дорог —
влечет наложение штрафа в сумме одной второй базовой расчетной величины.',
  0.5,
  NULL,
  54,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '138-modda 3-band',
  'Ushbu moddaning birinchi yoki ikkinchi qismida ko‘rsatilgan shaxslarning yo‘l harakati qoidalarini buzishi avariya holatini vujudga keltirsa, —
bazaviy hisoblash miqdorining bir baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Ушбу модданинг биринчи ёки иккинчи қисмида кўрсатилган шахсларнинг йўл ҳаракати қоидаларини бузиши авария ҳолатини вужудга келтирса, —
базавий ҳисоблаш миқдорининг бир баравари миқдорида жарима солишга сабаб бўлади.',
  'Нарушение правил дорожного движения лицами, указанными в части первой или второй настоящей статьи, повлекшее создание аварийной обстановки, —
влечет наложение штрафа в сумме одной базовой расчетной величины.',
  1,
  NULL,
  55,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '138-modda 4-band',
  'Transport vositasi harakatlanayotgan vaqtda yo‘lovchi tomonidan tana qismlarini (qo‘ldan tashqari) salondan chiqarish, —
bazaviy hisoblash miqdorining bir baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситаси ҳаракатланаётган вақтда йўловчи томонидан тана қисмларини (қўлдан ташқари) салондан чиқариш, —
базавий ҳисоблаш миқдорининг бир баравари миқдорида жарима солишга сабаб бўлади.',
  'Высовывание пассажиром частей тела (кроме рук) из салона во время движения транспортного средства —
влечет наложение штрафа в сумме одной базовой расчетной величины.',
  1,
  NULL,
  56,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '138-modda 5-band',
  'Belgilangan tartibda nur qaytargichlar va chiroqlar bilan jihozlanmagan individual harakatlanish vositalarini, skuterlar, mopedlar, velosipedlarni hamda ulovli aravani boshqarish, shuningdek individual harakatlanish vositalarining va skuterlarning haydovchilari tomonidan odamlarni tashish, —
bazaviy hisoblash miqdorining ikkidan bir qismi miqdorida jarima solishga sabab bo‘ladi.',
  'Белгиланган тартибда нур қайтаргичлар ва чироқлар билан жиҳозланмаган индивидуал ҳаракатланиш воситаларини, скутерлар, мопедлар, велосипедларни ҳамда уловли аравани бошқариш, шунингдек индивидуал ҳаракатланиш воситаларининг ва скутерларнинг ҳайдовчилари томонидан одамларни ташиш, —
базавий ҳисоблаш миқдорининг иккидан бир қисми миқдорида жарима солишга сабаб бўлади.',
  'Управление средствами индивидуального передвижения, скутерами, мопедами и велосипедами, не оборудованными в установленном порядке светоотражателями и фонарями, а также перевозка людей водителями средств индивидуального передвижения и скутеров, —
влечет наложение штрафа в сумме одной второй базовой расчетной величины.',
  0.5,
  NULL,
  57,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '138-modda 6-band',
  'Skuter, moped, velosipedni, individual harakatlanish vositasini, ulovli aravani boshqarib borayotgan shaxsning alkogolli ichimlik, giyohvandlik moddasi ta’sirida yoki o‘zgacha tarzda mast bo‘lgan holda yo‘l harakati qoidalarini buzishi, —
bazaviy hisoblash miqdorining uch baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Скутер, мопед, велосипедни, индивидуал ҳаракатланиш воситасини, уловли аравани бошқариб бораётган шахснинг алкоголли ичимлик, гиёҳвандлик моддаси таъсирида ёки ўзгача тарзда маст бўлган ҳолда йўл ҳаракати қоидаларини бузиши, —
базавий ҳисоблаш миқдорининг уч баравари миқдорида жарима солишга сабаб бўлади.',
  'Нарушение правил дорожного движения лицом, управляющим скутером, мопедом, велосипедом, средством индивидуального передвижения, ведущим гужевую повозку, совершенное в состоянии алкогольного, наркотического или иного опьянения, —
влечет наложение штрафа в сумме трех базовых расчетных величин.',
  3,
  NULL,
  58,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '139-modda 1-band',
  'Transport vositalarining texnik holati va ulardan foydalanish uchun mas’ul bo‘lgan shaxs tomonidan belgilangan tartibda ro‘yxatdan o‘tkazilmagan yoki majburiy texnik ko‘rikdan o‘tkazilmagan transport vositalarini yo‘lga chiqarish, —
bazaviy hisoblash miqdorining ikki baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситаларининг техник ҳолати ва улардан фойдаланиш учун масъул бўлган шахс томонидан белгиланган тартибда рўйхатдан ўтказилмаган ёки мажбурий техник кўрикдан ўтказилмаган транспорт воситаларини йўлга чиқариш, —
базавий ҳисоблаш миқдорининг икки баравари миқдорида жарима солишга сабаб бўлади.',
  'Выпуск на линию транспортных средств, не зарегистрированных в установленном порядке или не прошедших обязательный технический осмотр лицом, ответственным за техническое состояние и эксплуатацию транспортных средств, —
влечет наложение штрафа в сумме двух базовых расчетных величин.',
  2,
  NULL,
  59,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '139-modda 2-band',
  'Transport vositalarining texnik holati va ulardan foydalanish uchun mas’ul bo‘lgan shaxs tomonidan nosozligi bo‘lgan yoki muayyan shartlar tufayli transport vositasidan foydalanish taqiqlangan yoki tegishli ruxsatnomasiz qayta jihozlangan transport vositalarini yo‘lga chiqarish, —
bazaviy hisoblash miqdorining besh baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситаларининг техник ҳолати ва улардан фойдаланиш учун масъул бўлган шахс томонидан носозлиги бўлган ёки муайян шартлар туфайли транспорт воситасидан фойдаланиш тақиқланган ёки тегишли рухсатномасиз қайта жиҳозланган транспорт воситаларини йўлга чиқариш, —
базавий ҳисоблаш миқдорининг беш баравари миқдорида жарима солишга сабаб бўлади.',
  'Выпуск на линию транспортных средств, имеющих неисправности или условия, при которых эксплуатация транспортных средств запрещена, или переоборудованных без соответствующего разрешения лицом, ответственным за техническое состояние и эксплуатацию транспортных средств, —
влечет наложение штрафа в сумме пяти базовых расчетных величин.',
  5,
  NULL,
  60,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '140-modda 1-band',
  'Transport vositalaridan foydalanish uchun mas’ul bo‘lgan shaxs tomonidan mastlik holatida yoki giyohvandlik vositalari, ularning analoglari, psixotrop yoki shaxsning aql-idrokiga ta’sir ko‘rsatuvchi boshqa moddalar ta’siri ostida bo‘lgan haydovchilarning yoki transport vositalarini boshqarish huquqi bo‘lmagan shaxslarning transport vositalarini boshqarishiga yo‘l qo‘yish, —
bazaviy hisoblash miqdorining o‘ttiz baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситаларидан фойдаланиш учун масъул бўлган шахс томонидан мастлик ҳолатида ёки гиёҳвандлик воситалари, уларнинг аналоглари, психотроп ёки шахснинг ақл-идрокига таъсир кўрсатувчи бошқа моддалар таъсири остида бўлган ҳайдовчиларнинг ёки транспорт воситаларини бошқариш ҳуқуқи бўлмаган шахсларнинг транспорт воситаларини бошқаришига йўл қўйиш, —
базавий ҳисоблаш миқдорининг ўттиз баравари миқдорида жарима солишга сабаб бўлади.',
  'Допуск к управлению транспортными средствами водителей, находящегося в состоянии алкогольного опьянения или под воздействием наркотических средств, их аналогов, психотропных или иных веществ, влияющих на интеллектуально-волевую деятельность лица, или лиц, не имеющих права управления транспортными средствами, лицом, ответственным за его эксплуатацию, —
влечет наложение штрафа в размере тридцати базовых расчетных величин.',
  30,
  NULL,
  61,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '140-modda 2-band',
  'Transport vositasining egasi yoki undan foydalanish huquqiga ega bo‘lgan shaxs tomonidan bila turib mastlik holatidagi yoki giyohvandlik vositalari, ularning analoglari, psixotrop yoki shaxsning aql-idrokiga ta’sir ko‘rsatuvchi boshqa moddalar ta’siri ostidagi shaxsga transport vositasini boshqarishni topshirish, —
transport vositalarini boshqarish huquqidan ikki yildan uch yilgacha muddatga mahrum qilib, bazaviy hisoblash miqdorining o‘ttiz baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситасининг эгаси ёки ундан фойдаланиш ҳуқуқига эга бўлган шахс томонидан била туриб мастлик ҳолатидаги ёки гиёҳвандлик воситалари, уларнинг аналоглари, психотроп ёки шахснинг ақл-идрокига таъсир кўрсатувчи бошқа моддалар таъсири остидаги шахсга транспорт воситасини бошқаришни топшириш, —
транспорт воситаларини бошқариш ҳуқуқидан икки йилдан уч йилгача муддатга маҳрум қилиб, базавий ҳисоблаш миқдорининг ўттиз баравари миқдорида жарима солишга сабаб бўлади.',
  'Передача управления транспортным средством лицу, заведомо находящемуся в состоянии алкогольного опьянения или под воздействием наркотических средств, их аналогов, психотропных или иных веществ, влияющих на интеллектуально-волевую деятельность лица, владельцем транспортного средства или лицом, имеющим право на эксплуатацию транспортного средства, —
влечет наложение штрафа в размере тридцати базовых расчетных величин с лишением права управления транспортными средствами на срок от двух до трех лет.',
  30,
  NULL,
  62,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '140-modda 3-band',
  'Ushbu moddaning ikkinchi qismida ko‘rsatilgan huquqbuzarlik ma’muriy jazo chorasi qo‘llanilganidan keyin bir yil davomida takror sodir etilgan bo‘lsa, —
bazaviy hisoblash miqdorining ellik baravari miqdorida jarima solishga yoki o‘n besh sutka muddatga ma’muriy qamoqqa olishga sabab bo‘ladi.',
  'Ушбу модданинг иккинчи қисмида кўрсатилган ҳуқуқбузарлик маъмурий жазо чораси қўлланилганидан кейин бир йил давомида такрор содир этилган бўлса, —
базавий ҳисоблаш миқдорининг эллик баравари миқдорида жарима солишга ёки ўн беш сутка муддатга маъмурий қамоққа олишга сабаб бўлади.',
  'Совершение правонарушения, указанного в части второй настоящей статьи, повторно в течение года после применения административного взыскания —
влечет наложение штрафа в размере пятидесяти базовых расчетных величин или административный арест на срок пятнадцать суток.',
  50,
  NULL,
  63,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '141-modda 1-band',
  'Haydovchilarning korxonalar, muassasalar va tashkilotlarga qarashli transport vositalaridan shaxsiy boylik orttirish maqsadida foydalanishi —
bazaviy hisoblash miqdorining ikki baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Ҳайдовчиларнинг корхоналар, муассасалар ва ташкилотларга қарашли транспорт воситаларидан шахсий бойлик орттириш мақсадида фойдаланиши —
базавий ҳисоблаш миқдорининг икки баравари миқдорида жарима солишга сабаб бўлади.',
  'Использование водителями транспортных средств, принадлежащих предприятиям, учреждениям и организациям, в целях личной наживы —
влечет наложение штрафа в сумме двух базовых расчетных величин.',
  2,
  NULL,
  64,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '147-modda 1-band',
  'Yo‘llarga, temir yo‘ldan o‘tish joylariga, yo‘l harakatini tartibga soluvchi boshqa inshootlar yoki texnik vositalarga shikast yetkazish, shuningdek yo‘l harakatiga qasddan, shu jumladan yo‘l qoplamasini ifloslantirish yo‘li bilan xalal berish, xuddi shuningdek avtomobil yo‘llarini o‘zboshimchalik bilan qazish, ularda sun’iy notekisliklar va to‘siqlar yaratish, shu jumladan yo‘l harakati ishtirokchilarining harakatiga to‘sqinlik qiluvchi noqonuniy to‘siqlarni va boshqa qurilmalarni o‘rnatish, avtomobil yo‘lida ishlarni amalga oshirish uchun berilgan ruxsatnoma talablarini bajarmaslik, shu jumladan yo‘llarda qurilish-qazish ishlarini olib borgan shaxslar tomonidan belgilangan muddatlarda yo‘l infratuzilmasini oldingi holatiga keltirmaslik, shuningdek yo‘llarni saqlash qoidalarini buzish —
fuqarolarga bazaviy hisoblash miqdorining besh baravari miqdorida, mansabdor shaxslarga esa — yigirma baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Йўлларга, темир йўлдан ўтиш жойларига, йўл ҳаракатини тартибга солувчи бошқа иншоотлар ёки техник воситаларга шикаст етказиш, шунингдек йўл ҳаракатига қасддан, шу жумладан йўл қопламасини ифлослантириш йўли билан халал бериш, худди шунингдек автомобиль йўлларини ўзбошимчалик билан қазиш, уларда сунъий нотекисликлар ва тўсиқлар яратиш, шу жумладан йўл ҳаракати иштирокчиларининг ҳаракатига тўсқинлик қилувчи ноқонуний тўсиқларни ва бошқа қурилмаларни ўрнатиш, автомобиль йўлида ишларни амалга ошириш учун берилган рухсатнома талабларини бажармаслик, шу жумладан йўлларда қурилиш-қазиш ишларини олиб борган шахслар томонидан белгиланган муддатларда йўл инфратузилмасини олдинги ҳолатига келтирмаслик, шунингдек йўлларни сақлаш қоидаларини бузиш —
фуқароларга базавий ҳисоблаш миқдорининг беш баравари миқдорида, мансабдор шахсларга эса — йигирма баравари миқдорида жарима солишга сабаб бўлади.',
  'Повреждение дорог, железнодорожных переездов, других сооружений или технических средств регулирования дорожного движения, а также умышленное создание помех для дорожного движения, в том числе путем загрязнения дорожного покрытия, а равно самовольная раскопка автомобильных дорог, возведение на них искусственных неровностей и препятствий, в том числе установка незаконных заграждений и иных устройств, препятствующих движению участников дорожного движения, неисполнение требований разрешения, выданного для осуществления работ на автомобильной дороге, в том числе не приведение в прежнее состояние дорожной инфраструктуры в установленные сроки, лицами, проводившими строительно-раскопочные работы на дорогах, а также нарушение правил содержания дорог —
влечет наложение штрафа на граждан в сумме пяти, а на должностных лиц — двадцати базовых расчетных величин.',
  5,
  20,
  65,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '147-modda 2-band',
  'Yo‘l belgilarini o‘rnatish, yo‘llarni, temir yo‘ldan kesib o‘tish joylari va boshqa yo‘l inshootlarini harakat uchun xavfsiz holda saqlash qoidalarini buzish yoki ta’mirlash ishlari olib boriladigan yo‘l qismiga vaqtincha yo‘l belgilari, signallar va svetoforlar, to‘suvchi va yo‘naltiruvchi moslamalar o‘rnatmaslik, shuningdek qatnov qismiga vaqtincha yotiq chiziqlar chizmaslik yoxud yo‘lning ayrim qismlaridan foydalanish harakat xavfsizligiga tahdid etadigan paytda ularda harakatni o‘z vaqtida taqiqlash yoki cheklash choralarini ko‘rmaslik, —
mansabdor shaxslarga bazaviy hisoblash miqdorining yigirma besh baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Йўл белгиларини ўрнатиш, йўлларни, темир йўлдан кесиб ўтиш жойлари ва бошқа йўл иншоотларини ҳаракат учун хавфсиз ҳолда сақлаш қоидаларини бузиш ёки таъмирлаш ишлари олиб бориладиган йўл қисмига вақтинча йўл белгилари, сигналлар ва светофорлар, тўсувчи ва йўналтирувчи мосламалар ўрнатмаслик, шунингдек қатнов қисмига вақтинча ётиқ чизиқлар чизмаслик ёхуд йўлнинг айрим қисмларидан фойдаланиш ҳаракат хавфсизлигига таҳдид этадиган пайтда уларда ҳаракатни ўз вақтида тақиқлаш ёки чеклаш чораларини кўрмаслик, —
мансабдор шахсларга базавий ҳисоблаш миқдорининг йигирма беш баравари миқдорида жарима солишга сабаб бўлади.',
  'Нарушение правил установки дорожных знаков, содержания дорог, железнодорожных переездов и других дорожных сооружений в безопасном для движения состоянии или не установка на проезжей части, где проводятся ремонтные работы, временных дорожных знаков, сигналов и светофоров, ограждений и направляющих приспособлений, а также не нанесение на проезжей части временных дорожных полос либо непринятие мер к своевременному запрещению или ограничению движения на отдельных участках дорог, когда пользование ими угрожает безопасности движения —
влечет наложение штрафа на должностных лиц в сумме двадцати пяти базовых расчетных величин.',
  25,
  NULL,
  66,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '194-modda 1-band',
  'Ichki ishlar organlari xodimining huquqbuzarlikni to‘xtatish, hujjatlarni tekshirish uchun taqdim etish, ichki ishlar organlariga borish yoki ko‘rsatilgan muddatda ichki ishlar organlarida bo‘lish to‘g‘risidagi qonuniy talablarini uzrli sabablarsiz bajarmaslik, transport vositasini to‘xtatish, jabrlanuvchilarga yordam ko‘rsatish haqidagi qonuniy talablarini bajarmaslik yoxud ichki ishlar organlari xodimining qonuniy talablariga boshqacha tarzda bo‘ysunmaslik, xuddi shuningdek jamoat tartibini saqlash hamda fuqarolarning huquqlari va erkinliklarini ta’minlash vazifalarini amalga oshirayotgan boshqa shaxslarning qonuniy talablarini bajarmaslik, —
bazaviy hisoblash miqdorining bir baravaridan o‘n ikki baravarigacha miqdorda jarima solishga sabab bo‘ladi.',
  'Ички ишлар органлари ходимининг ҳуқуқбузарликни тўхтатиш, ҳужжатларни текшириш учун тақдим этиш, ички ишлар органларига бориш ёки кўрсатилган муддатда ички ишлар органларида бўлиш тўғрисидаги қонуний талабларини узрли сабабларсиз бажармаслик, транспорт воситасини тўхтатиш, жабрланувчиларга ёрдам кўрсатиш ҳақидаги қонуний талабларини бажармаслик ёхуд ички ишлар органлари ходимининг қонуний талабларига бошқача тарзда бўйсунмаслик, худди шунингдек жамоат тартибини сақлаш ҳамда фуқароларнинг ҳуқуқлари ва эркинликларини таъминлаш вазифаларини амалга ошираётган бошқа шахсларнинг қонуний талабларини бажармаслик, —
базавий ҳисоблаш миқдорининг бир бараваридан ўн икки бараваригача миқдорда жарима солишга сабаб бўлади.',
  'Невыполнение законных требований сотрудника органов внутренних дел о прекращении правонарушений, предъявлении документов для проверки, о следовании или явке в орган внутренних дел в указанный срок без уважительных причин, об остановке транспортного средства, оказании помощи пострадавшим либо иное неповиновение законным требованиям сотрудника органов внутренних дел, а равно невыполнение законных требований других лиц, осуществляющих обязанности по охране общественного порядка и обеспечению прав и свобод граждан, —
влечет наложение штрафа от одной до двенадцати базовых расчетных величин.',
  1,
  12,
  67,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '194-modda 2-band',
  'Xuddi shunday huquqbuzarlik ma’muriy jazo chorasi qo‘llanilganidan keyin bir yil davomida takror sodir etilgan bo‘lsa, —
bazaviy hisoblash miqdorining o‘n ikki baravaridan o‘n besh baravarigacha miqdorda jarima solishga yoki o‘n besh sutkagacha muddatga ma’muriy qamoqqa olishga sabab bo‘ladi.',
  'Худди шундай ҳуқуқбузарлик маъмурий жазо чораси қўлланилганидан кейин бир йил давомида такрор содир этилган бўлса, —
базавий ҳисоблаш миқдорининг ўн икки бараваридан ўн беш бараваригача миқдорда жарима солишга ёки ўн беш суткагача муддатга маъмурий қамоққа олишга сабаб бўлади.',
  'То же правонарушение, совершенное повторно в течение года после применения административного взыскания, —
влечет наложение штрафа от двенадцати до пятнадцати базовых расчетных величин или административный арест до пятнадцати суток.',
  12,
  15,
  68,
  TRUE,
  now()
);
INSERT INTO traffic_fines (article_code, title_uzl, title_uzc, title_ru, bhm_min, bhm_max, sort_order, active, updated_at) VALUES (
  '194-modda 3-band',
  'Transport vositasi haydovchisi tomonidan ichki ishlar organi xodimining yoki xodimlarining transport vositasini to‘xtatish haqida berilgan qonuniy talablarini ketma-ket bir necha marta uzrli sabablarsiz bajarmaslik, —
transport vositalarini boshqarish huquqidan bir yil muddatga mahrum qilib, bazaviy hisoblash miqdorining o‘ttiz baravari miqdorida jarima solishga sabab bo‘ladi.',
  'Транспорт воситаси ҳайдовчиси томонидан ички ишлар органи ходимининг ёки ходимларининг транспорт воситасини тўхтатиш ҳақида берилган қонуний талабларини кетма-кет бир неча марта узрли сабабларсиз бажармаслик, —
транспорт воситаларини бошқариш ҳуқуқидан бир йил муддатга маҳрум қилиб, базавий ҳисоблаш миқдорининг ўттиз баравари миқдорида жарима солишга сабаб бўлади.',
  'Невыполнение водителем транспортного средства несколько раз подряд без уважительных причин законных требований сотрудника или сотрудников органов внутренних дел об остановке транспортного средства —
влечет наложение штрафа в размере тридцати базовых расчетных величин с лишением права управления транспортными средствами сроком на один год.',
  30,
  NULL,
  69,
  TRUE,
  now()
);
