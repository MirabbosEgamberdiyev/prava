import type { PenaltyRule } from "../types";

export const PENALTY_RULES: Record<string, PenaltyRule> = {
  SEATBELT_NOT_FASTENED: {
    code: "SEATBELT_NOT_FASTENED",
    title: {
      uzl: "Xavfsizlik kamari taqilmadi",
      uzc: "Хавфсизлик камари тақилмади",
      ru: "Ремень безопасности не пристегнут",
    },
    points: 15,
    severity: "MEDIUM",
    isInstantFail: false,
    explanation: {
      uzl: "Harakatni boshlashdan avval xavfsizlik kamarini taqish shart.",
      uzc: "Ҳаракатни бошлашдан аввал хавфсизлик камарини тақиш шарт.",
      ru: "Перед началом движения необходимо пристегнуть ремень безопасности.",
    },
  },
  LIGHTS_NOT_TURNED_ON: {
    code: "LIGHTS_NOT_TURNED_ON",
    title: {
      uzl: "Fara chiroqlari yoqilmadi",
      uzc: "Фара чироқлари ёқилмади",
      ru: "Ближний свет фар не включен",
    },
    points: 10,
    severity: "MINOR",
    isInstantFail: false,
    explanation: {
      uzl: "Avtodromda harakatlanish paytida yaqinni yorituvchi chiroqlar yoqilgan bo'lishi shart.",
      uzc: "Автодромда ҳаракатланиш пайтида яқинни ёритувчи чироқлар ёқилган бўлиши шарт.",
      ru: "При движении по автодрому должен быть включен ближний свет фар.",
    },
  },
  TURN_SIGNAL_NOT_USED: {
    code: "TURN_SIGNAL_NOT_USED",
    title: {
      uzl: "Burilish signali berilmadi",
      uzc: "Бурилиш сигнали берилмади",
      ru: "Указатель поворота не включен",
    },
    points: 10,
    severity: "MINOR",
    isInstantFail: false,
    explanation: {
      uzl: "Harakatni boshlash va manevr paytida burilish chirog'ini yoqish talab qilinadi.",
      uzc: "Ҳаракатни бошлаш ва маневр пайтида бурилиш чироғини ёқиш талаб қилинади.",
      ru: "При начале движения и маневрировании необходимо включать сигнал поворота.",
    },
  },
  STOP_LINE_CROSSED: {
    code: "STOP_LINE_CROSSED",
    title: {
      uzl: "Stop-chiziq bosildi yoki kesib o'tildi",
      uzc: "Стоп-чизиқ босилди ёки кесиб ўтилди",
      ru: "Наезд на стоп-линию или ее пересечение",
    },
    points: 20,
    severity: "MEDIUM",
    isInstantFail: false,
    explanation: {
      uzl: "Stop-chiziq oldida avtomobilning old g'ildiraklari chiziqqa tegmasdan to'xtashi lozim.",
      uzc: "Стоп-чизиқ олдида автомобилнинг олд ғилдираклари чизиққа тегмасдан тўхташи лозим.",
      ru: "Остановка перед стоп-линией должна производиться без наезда на нее колесами.",
    },
  },
  CONE_COLLISION: {
    code: "CONE_COLLISION",
    title: {
      uzl: "To'siq konusi urib yuborildi",
      uzc: "Тўсиқ конуси уриб юборилди",
      ru: "Сбит разметочный конус",
    },
    points: 20,
    severity: "MEDIUM",
    isInstantFail: false,
    explanation: {
      uzl: "Mashq zonasidagi to'siq konuslariga teginish qat'iyan man etiladi.",
      uzc: "Машқ зонасидаги тўсиқ конусларига тегиниш қатъиян ман этилади.",
      ru: "Задевать разметочные конусы на упражнении строго запрещено.",
    },
  },
  BOUNDARY_CROSSED: {
    code: "BOUNDARY_CROSSED",
    title: {
      uzl: "Chegara chizig'i bosildi",
      uzc: "Чегара чизиғи босилди",
      ru: "Наезд на сплошную линию границы упражнения",
    },
    points: 20,
    severity: "MEDIUM",
    isInstantFail: false,
    explanation: {
      uzl: "Mashq maydonchasining yaxlit chiziqlari ustiga chiqish qoidabuzarlik hisoblanadi.",
      uzc: "Машқ майдончасининг яхлит чизиқлари устига чиқиш қоидабузарлик ҳисобланади.",
      ru: "Наезд колесом на сплошную линию разметки границы упражнения является нарушением.",
    },
  },
  WALL_COLLISION: {
    code: "WALL_COLLISION",
    title: {
      uzl: "To'siqqa yoki bordyurga qattiq urilish",
      uzc: "Тўсиққа ёки бордюрга қаттиқ урилиш",
      ru: "Столкновение с ограждением или бордюром",
    },
    points: 100,
    severity: "CRITICAL",
    isInstantFail: true,
    explanation: {
      uzl: "Avtodrom to'siqlari yoki bordyurlariga urilish imtihonni darhol to'xtatishga sabab bo'ladi.",
      uzc: "Автодром тўсиқлари ёки бордюрларига урилиш имтиҳонни дарҳол тўхтатишга сабаб бўлади.",
      ru: "Столкновение с ограждениями приводит к немедленному прекращению экзамена.",
    },
  },
  ROLLBACK_EXCEEDED: {
    code: "ROLLBACK_EXCEEDED",
    title: {
      uzl: "Estakadada orqaga 20 sm dan ortiq sirpanish",
      uzc: "Эстакадада орқага 20 см дан ортиқ сирпаниш",
      ru: "Откат на эстакаде назад более 20 см",
    },
    points: 100,
    severity: "CRITICAL",
    isInstantFail: true,
    explanation: {
      uzl: "Qiyalikda qo'zg'alishda orqaga 20 sm dan ortiq sirpanish xavfli hisoblanadi va imtihondan yiqitadi.",
      uzc: "Қияликда қўзғалишда орқага 20 см дан ортиқ сирпаниш хавфли ҳисобланади ва имтиҳондан йиқитади.",
      ru: "Откат автомобиля назад на подъеме более чем на 20 см является грубой ошибкой.",
    },
  },
  RED_LIGHT_VIOLATION: {
    code: "RED_LIGHT_VIOLATION",
    title: {
      uzl: "Svetoforning qizil chirog'ida o'tish",
      uzc: "Светофорнинг қизил чироғида ўтиш",
      ru: "Проезд на запрещающий сигнал светофора",
    },
    points: 100,
    severity: "CRITICAL",
    isInstantFail: true,
    explanation: {
      uzl: "Taqiqlovchi signalda chorrahaga kirish qo'pol qoidabuzarlik hisoblanadi.",
      uzc: "Тақиқловчи сигналда чорраҳага кириш қўпол қоидабузарлик ҳисобланади.",
      ru: "Выезд на перекресток на запрещающий сигнал влечет оценку 'Не сдал'.",
    },
  },
  PEDESTRIAN_YIELD_FAIL: {
    code: "PEDESTRIAN_YIELD_FAIL",
    title: {
      uzl: "Piyodaga yo'l berilmadi",
      uzc: "Пиёдага йўл берилмади",
      ru: "Не уступили дорогу пешеходу",
    },
    points: 100,
    severity: "CRITICAL",
    isInstantFail: true,
    explanation: {
      uzl: "Piyodalar o'tish joyida piyodaga yo'l bermaslik o'ta xavfli harakat.",
      uzc: "Пиёдалар ўтиш жойида пиёдага йўл бермаслик ўта хавфли ҳаракат.",
      ru: "Непредоставление преимущества пешеходу является критическим нарушением.",
    },
  },
  RAILWAY_BARRIER_VIOLATION: {
    code: "RAILWAY_BARRIER_VIOLATION",
    title: {
      uzl: "Yopiq temir yo'l shlagbaumiga yaqinlashish/o'tish",
      uzc: "Ёпиқ темир йўл шлагбаумига яқинлашиш/ўтиш",
      ru: "Проезд через железнодорожный переезд при закрытом шлагбауме",
    },
    points: 100,
    severity: "CRITICAL",
    isInstantFail: true,
    explanation: {
      uzl: "Temir yo'l kesishmasida xavfsizlik qoidalarini buzish qat'iyan man etiladi.",
      uzc: "Темир йўл кесишмасида хавфсизлик қоидаларини бузиш қатъиян ман этилади.",
      ru: "Нарушение правил проезда железнодорожных переездов категорически запрещено.",
    },
  },
  SPEED_LIMIT_EXCEEDED: {
    code: "SPEED_LIMIT_EXCEEDED",
    title: {
      uzl: "Avtodrom tezlik me'yori oshirildi",
      uzc: "Автодром тезлик меъёри оширилди",
      ru: "Превышение установленной скорости на автодроме",
    },
    points: 20,
    severity: "MEDIUM",
    isInstantFail: false,
    explanation: {
      uzl: "Mashq zonasida ruxsat etilgan tezlik chegarasidan oshmaslik kerak.",
      uzc: "Машқ зонасида рухсат этилган тезлик чегарасидан ошмаслик керак.",
      ru: "Скорость в границах автодрома строго регламентирована.",
    },
  },
  HANDBRAKE_NOT_ENGAGED: {
    code: "HANDBRAKE_NOT_ENGAGED",
    title: {
      uzl: "To'xtashda qo'l tormozi tortilmadi",
      uzc: "Тўхташда қўл тормози тортилмади",
      ru: "Не задействован стояночный тормоз при остановке",
    },
    points: 15,
    severity: "MEDIUM",
    isInstantFail: false,
    explanation: {
      uzl: "Estakadada va Finishta to'xtaganda qo'l tormozini (ruchnik) tortish majburiydir.",
      uzc: "Эстакадада ва Финишда тўхтаганда қўл тормозини (ручник) тортиш мажбурийдир.",
      ru: "На эстакаде и линии финиша необходимо фиксировать авто ручным тормозом.",
    },
  },
};
