import type { Book, Word } from '../types';

export const books: Book[] = [
  {
    id: 'cet4',
    name: '四级核心词汇',
    level: 'CET-4',
    blurb: '大学英语四级阅读和写作里反复出现的骨干词，适合打底。',
    tint: '#0d9a62',
    ink: '#e9fff4',
  },
  {
    id: 'cet6',
    name: '六级核心词汇',
    level: 'CET-6',
    blurb: '六级真题里区分度更高的书面词，认识它们，阅读会顺很多。',
    tint: '#0f6e8c',
    ink: '#e7f7fb',
  },
  {
    id: 'kaoyan',
    name: '考研核心词汇',
    level: '考研',
    blurb: '考研英语阅读常见的学术动词和评价词，用来啃长难句。',
    tint: '#1f4d3a',
    ink: '#e7f3ec',
  },
  {
    id: 'ielts',
    name: '雅思核心词汇',
    level: 'IELTS',
    blurb: '写作和阅读都用得上的话题词，先把搭配用顺。',
    tint: '#c47b2b',
    ink: '#fff6ea',
  },
];

function w(
  bookId: string,
  word: string,
  phonetic: string,
  senses: [string, string][],
  example: [string, string],
  tip: string,
  synonyms: string[],
): Word {
  return {
    id: `${bookId}-${word}`,
    bookId,
    word,
    phonetic,
    senses: senses.map(([pos, def]) => ({ pos, def })),
    examples: [{ en: example[0], zh: example[1] }],
    tip,
    synonyms,
  };
}

export const words: Word[] = [
  w('cet4', 'abandon', '/əˈbændən/', [['v.', '放弃；抛弃；中止'], ['n.', '放任']], ['They chose to abandon the old plan.', '他们决定放弃原来的计划。'], 'a- 表离开，松开原本的管束，就是不再管了。', ['desert', 'quit']),
  w('cet4', 'absorb', '/əbˈzɔːrb/', [['v.', '吸收；理解；使沉浸']], ['Dry soil can absorb a lot of rain.', '干土能吸收很多雨水。'], 'ab- 向内 + sorb 吸，把东西吸进来。', ['soak', 'take in']),
  w('cet4', 'abstract', '/ˈæbstrækt/', [['adj.', '抽象的'], ['n.', '摘要']], ['The article is too abstract for new readers.', '这篇文章对初读者来说太抽象了。'], 'abs- 抽离 + tract 拉，把具体细节抽走。', ['theoretical', 'summary']),
  w('cet4', 'abundant', '/əˈbʌndənt/', [['adj.', '丰富的；充裕的']], ['The valley has abundant rainfall.', '这片山谷雨水充沛。'], 'abound 是“大量存在”，加上 -ant 变成形容词。', ['plentiful', 'rich']),
  w('cet4', 'accelerate', '/əkˈseləreɪt/', [['v.', '加速；促进']], ['The car began to accelerate on the empty road.', '车子在空路上开始加速。'], 'ac- 加强 + celer 快，让速度加上去。', ['speed up', 'hasten']),
  w('cet4', 'accommodate', '/əˈkɑːmədeɪt/', [['v.', '容纳；提供住宿；适应']], ['The hall can accommodate two hundred guests.', '这个大厅能容纳两百位客人。'], '和“空间够不够”绑在一起记：能装下，也能迁就。', ['hold', 'lodge']),
  w('cet4', 'accompany', '/əˈkʌmpəni/', [['v.', '陪伴；伴随']], ['A short note will accompany the gift.', '礼物里会附上一张短笺。'], 'company 是同伴，accompany 就是与之同行。', ['go with', 'attend']),
  w('cet4', 'accomplish', '/əˈkɑːmplɪʃ/', [['v.', '完成；实现']], ['She worked late to accomplish the report.', '她加班把报告做完了。'], 'accompli 有“做成”的感觉，重点是把事办妥。', ['achieve', 'complete']),
  w('cet4', 'accurate', '/ˈækjərət/', [['adj.', '准确的；精确的']], ['Please keep an accurate record of the time.', '请把时间准确记下来。'], 'cure 在这里不是治疗，而是“小心”，做得很准。', ['exact', 'precise']),
  w('cet4', 'accuse', '/əˈkjuːz/', [['v.', '指责；控告']], ['Nobody should accuse him without proof.', '没有证据就不该指责他。'], '后面常接 accuse sb of sth。', ['charge', 'blame']),
  w('cet4', 'achieve', '/əˈtʃiːv/', [['v.', '达到；实现']], ['Hard practice helped him achieve the goal.', '刻苦练习帮他达成了目标。'], 'chief 有“顶点”的影子，achieve 是走到那个结果。', ['reach', 'attain']),
  w('cet4', 'acknowledge', '/əkˈnɑːlɪdʒ/', [['v.', '承认；告知收到；致谢']], ['He had to acknowledge the mistake in public.', '他不得不当众承认这个错误。'], 'knowledge 前面加 ac-，把知道的事说出来。', ['admit', 'recognize']),
  w('cet4', 'acquire', '/əˈkwaɪər/', [['v.', '获得；习得']], ['Children acquire language by listening.', '孩子靠听来习得语言。'], '技能和语言多用 acquire，强调逐渐得到。', ['gain', 'obtain']),
  w('cet4', 'adapt', '/əˈdæpt/', [['v.', '适应；改编']], ['The team had to adapt to the new rules.', '团队必须适应新规则。'], 'adapt to 适应；adapt A for B 为某目的改编。', ['adjust', 'modify']),
  w('cet4', 'adequate', '/ˈædɪkwət/', [['adj.', '足够的；合格的']], ['The kitchen has adequate light in the morning.', '早上厨房的光线够用。'], '不是“很多”，只是刚刚够。', ['sufficient', 'enough']),
  w('cet4', 'adjust', '/əˈdʒʌst/', [['v.', '调整；适应']], ['You can adjust the height of this chair.', '你可以调节这把椅子的高度。'], 'just 有“恰好”的意思，adjust 是调到刚好。', ['tune', 'regulate']),
  w('cet4', 'advocate', '/ˈædvəkeɪt/', [['v.', '提倡；拥护'], ['n.', '提倡者']], ['She likes to advocate for cleaner streets.', '她喜欢倡导把街道弄得更干净。'], 'voc 表声音，advocate 是为某件事发声。', ['support', 'champion']),
  w('cet4', 'aggressive', '/əˈɡresɪv/', [['adj.', '好斗的；进取的']], ['The aggressive ads covered the whole wall.', '整面墙都是来势很猛的广告。'], '可贬可褒：攻击性强，或做事很猛。', ['forceful', 'hostile']),

  w('cet6', 'abolish', '/əˈbɑːlɪʃ/', [['v.', '废除；取消']], ['The town voted to abolish the old tax.', '镇上投票废除了那项旧税。'], '多用于制度、法律、习俗，不用于随便扔掉一个东西。', ['end', 'repeal']),
  w('cet6', 'absurd', '/əbˈsɜːrd/', [['adj.', '荒谬的；荒唐的']], ['The rumor is too absurd to believe.', '这个谣言荒唐得让人没法信。'], 'surd 有“不合理”的味道，absurd 就是说不通。', ['ridiculous', 'foolish']),
  w('cet6', 'acute', '/əˈkjuːt/', [['adj.', '急性的；敏锐的；严重的']], ['The nurse noticed an acute pain in his knee.', '护士注意到他膝盖一阵剧痛。'], '医学上 acute 对 chronic：来得急，不是拖很久。', ['sharp', 'severe']),
  w('cet6', 'adhere', '/ədˈhɪr/', [['v.', '粘附；坚持']], ['Please adhere to the safety rules.', '请遵守安全规则。'], 'adhere to 既是粘住，也是坚持规则。', ['stick', 'follow']),
  w('cet6', 'adjacent', '/əˈdʒeɪsnt/', [['adj.', '邻近的；毗连的']], ['The library is adjacent to the city hall.', '图书馆紧挨着市政厅。'], 'jacent 是“位于”，ad- 靠近，就在旁边。', ['neighboring', 'next']),
  w('cet6', 'aesthetic', '/esˈθetɪk/', [['adj.', '审美的；美学的']], ['The room has a quiet aesthetic charm.', '这个房间有一种安静的美感。'], '谈外观、品味、艺术感受时用它，不只是“漂亮”。', ['artistic', 'tasteful']),
  w('cet6', 'aggravate', '/ˈæɡrəveɪt/', [['v.', '加重；使恶化']], ['Dust will aggravate his cough.', '灰尘会加重他的咳嗽。'], 'grav 表重，aggravate 是让情况变得更重。', ['worsen', 'intensify']),
  w('cet6', 'alleviate', '/əˈliːvieɪt/', [['v.', '减轻；缓和']], ['A warm drink can alleviate a sore throat.', '热饮能缓解嗓子疼。'], 'lev 表轻，把负担变轻。和 aggravate 相反。', ['ease', 'relieve']),
  w('cet6', 'ambiguous', '/æmˈbɪɡjuəs/', [['adj.', '含糊的；模棱两可的']], ['The ending of the film is ambiguous.', '这部电影的结局含糊不清。'], 'ambi- 两边，两种理解都说得通。', ['vague', 'unclear']),
  w('cet6', 'ambitious', '/æmˈbɪʃəs/', [['adj.', '有雄心的；艰巨的']], ['She made an ambitious plan for the year.', '她为这一年制定了一个很大的计划。'], '可以形容人，也可以形容计划本身目标很高。', ['driven', 'bold']),
  w('cet6', 'amend', '/əˈmend/', [['v.', '修改；修正']], ['The editor will amend the last paragraph.', '编辑会修改最后一段。'], 'mend 是修补，amend 多用于文本、法律、错误。', ['revise', 'correct']),
  w('cet6', 'amplify', '/ˈæmplɪfaɪ/', [['v.', '放大；增强；详述']], ['The microphone will amplify her voice.', '麦克风会放大她的声音。'], 'ampl 表大，-fy 是“使……”。', ['boost', 'expand']),
  w('cet6', 'anonymous', '/əˈnɑːnɪməs/', [['adj.', '匿名的；不知名的']], ['An anonymous letter arrived this morning.', '今早来了一封匿名信。'], 'a- 没有 + onym 名字。', ['unnamed', 'unknown']),
  w('cet6', 'apparatus', '/ˌæpəˈrætəs/', [['n.', '器械；装置；机构']], ['The lab bought a new breathing apparatus.', '实验室买了一套新的呼吸装置。'], '可数名词，但复数常仍写作 apparatus。', ['device', 'equipment']),
  w('cet6', 'articulate', '/ɑːrˈtɪkjələt/', [['v.', '清楚地表达'], ['adj.', '善于表达的']], ['He can articulate the idea in one sentence.', '他能用一句话把这个想法讲清楚。'], '关节把骨头连起来，articulate 是把意思接清楚。', ['express', 'eloquent']),
  w('cet6', 'aspire', '/əˈspaɪər/', [['v.', '渴望；立志']], ['Many students aspire to study abroad.', '很多学生渴望出国学习。'], 'aspire to do / aspire to sth，目标在后面。', ['aim', 'hope']),
  w('cet6', 'authentic', '/ɔːˈθentɪk/', [['adj.', '真正的；可靠的']], ['This is an authentic letter from 1920.', '这是一封 1920 年的原信。'], '强调来源真实，不是仿的。', ['genuine', 'real']),
  w('cet6', 'autonomous', '/ɔːˈtɑːnəməs/', [['adj.', '自治的；自主的']], ['Each group is autonomous and sets its own pace.', '每一组都自主安排进度。'], 'auto- 自己 + nomos 规则，自己定规则。', ['independent', 'self-governing']),

  w('kaoyan', 'analogy', '/əˈnælədʒi/', [['n.', '类比；相似']], ['The teacher used an analogy to explain the theory.', '老师用一个类比来解释这个理论。'], 'by analogy 用类比的方式。', ['comparison', 'parallel']),
  w('kaoyan', 'ascertain', '/ˌæsərˈteɪn/', [['v.', '查明；确定']], ['The inspector tried to ascertain the cause.', '检查员试图查明原因。'], 'certain 是确定，ascertain 是去把它查实。', ['determine', 'find out']),
  w('kaoyan', 'assert', '/əˈsɜːrt/', [['v.', '断言；主张；维护']], ['The author likes to assert a strong opinion.', '作者喜欢断言一个很强的观点。'], 'assert oneself 是坚持自己的立场。', ['declare', 'claim']),
  w('kaoyan', 'assess', '/əˈses/', [['v.', '评估；评定']], ['Teachers assess essays with the same scale.', '老师用同一把尺子给作文评分。'], '和 asset 不同：assess 是估价、评价。', ['evaluate', 'judge']),
  w('kaoyan', 'assumption', '/əˈsʌmpʃn/', [['n.', '假定；承担']], ['The plan rests on one risky assumption.', '这个计划建立在一个冒险的假定上。'], 'assume 的名词。阅读题里常问作者假定了什么。', ['premise', 'supposition']),
  w('kaoyan', 'aversion', '/əˈvɜːrʒn/', [['n.', '厌恶；反感']], ['She has an aversion to crowded rooms.', '她反感拥挤的房间。'], 'aversion to sth。vers 表转，把脸转开。', ['dislike', 'distaste']),
  w('kaoyan', 'bias', '/ˈbaɪəs/', [['n.', '偏见；偏向'], ['v.', '使有偏见']], ['The sample shows a clear bias.', '这个样本有明显偏向。'], '可指统计偏差，也可指个人成见。', ['prejudice', 'slant']),
  w('kaoyan', 'bizarre', '/bɪˈzɑːr/', [['adj.', '古怪的；奇异的']], ['The dream had a bizarre ending.', '这个梦的结尾很古怪。'], '比 strange 更怪，带一点不可思议。', ['odd', 'weird']),
  w('kaoyan', 'bleak', '/bliːk/', [['adj.', '荒凉的；暗淡的']], ['The report paints a bleak picture of the winter.', '报告把这个冬天描绘得很惨淡。'], '风景、前景、心情都可以 bleak。', ['grim', 'dreary']),
  w('kaoyan', 'breach', '/briːtʃ/', [['n.', '违反；缺口'], ['v.', '突破；违背']], ['The leak was a breach of trust.', '这次泄露是对信任的破坏。'], 'breach of contract 违约。', ['violation', 'break']),
  w('kaoyan', 'bureaucracy', '/bjʊˈrɑːkrəsi/', [['n.', '官僚体制；官僚作风']], ['Too much bureaucracy slowed the project.', '太多重程序拖慢了项目。'], 'bureau 办公室 + cracy 统治。', ['red tape', 'administration']),
  w('kaoyan', 'catastrophe', '/kəˈtæstrəfi/', [['n.', '大灾难；惨败']], ['The flood was a catastrophe for the farms.', '这场洪水对农场是一场灾难。'], '比 accident 严重得多，常是大范围损失。', ['disaster', 'calamity']),
  w('kaoyan', 'chronic', '/ˈkrɑːnɪk/', [['adj.', '慢性的；长期的']], ['He has had chronic back pain for years.', '他腰背慢性疼痛已经好几年。'], 'chron 表时间，拖得很久。反义常是 acute。', ['persistent', 'long-term']),
  w('kaoyan', 'coherent', '/koʊˈhɪrənt/', [['adj.', '连贯的；一致的']], ['The essay is coherent from start to finish.', '这篇文章从头到尾是连贯的。'], 'co- 一起 + here 粘住，意思互相咬合。', ['logical', 'consistent']),
  w('kaoyan', 'compensate', '/ˈkɑːmpenseɪt/', [['v.', '补偿；弥补']], ['The company will compensate the workers.', '公司会补偿这些工人。'], 'compensate for 弥补某个损失。', ['repay', 'offset']),
  w('kaoyan', 'compile', '/kəmˈpaɪl/', [['v.', '汇编；编纂']], ['We will compile the data into one chart.', '我们会把数据汇编成一张图。'], '把散落的材料收成一份。', ['collect', 'assemble']),
  w('kaoyan', 'complement', '/ˈkɑːmplɪment/', [['n.', '补充；补语'], ['v.', '补足']], ['The sauce will complement the fish.', '这道酱能衬出鱼的味道。'], '和 compliment（称赞）只差一个字母。', ['supplement', 'complete']),
  w('kaoyan', 'compromise', '/ˈkɑːmprəmaɪz/', [['n.', '妥协'], ['v.', '妥协；损害']], ['They refused to compromise on safety.', '他们拒绝在安全问题上让步。'], '可指双方各让一步，也可指使某事受损。', ['settlement', 'concession']),

  w('ielts', 'anticipate', '/ænˈtɪsɪpeɪt/', [['v.', '预期；预料']], ['We anticipate a busy weekend at the museum.', '我们预计博物馆这个周末会很忙。'], 'anti- 在前，提前看到将要发生的事。', ['expect', 'foresee']),
  w('ielts', 'apparent', '/əˈpærənt/', [['adj.', '明显的；表面上的']], ['The reason became apparent after the test.', '测试之后原因就清楚了。'], 'apparent 有时只是“看起来如此”，未必是事实。', ['obvious', 'seeming']),
  w('ielts', 'approach', '/əˈproʊtʃ/', [['n.', '方法；途径'], ['v.', '接近；处理']], ['This approach saves both time and money.', '这个方法既省时间也省钱。'], '写作里 approach to doing sth 很常见。', ['method', 'way']),
  w('ielts', 'appropriate', '/əˈproʊpriət/', [['adj.', '合适的；恰当的']], ['Please wear appropriate shoes for the hike.', '徒步请穿合适的鞋。'], '重音在第二个音节。副词是 appropriately。', ['suitable', 'proper']),
  w('ielts', 'arbitrary', '/ˈɑːrbɪtreri/', [['adj.', '任意的；武断的']], ['The rule felt arbitrary to the players.', '这条规则在队员看来很武断。'], '没有充分理由、像随手定的。', ['random', 'willful']),
  w('ielts', 'aspect', '/ˈæspekt/', [['n.', '方面；面貌']], ['Cost is only one aspect of the choice.', '费用只是这个选择的一个方面。'], '写作中用来拆分论点：one aspect of。', ['side', 'facet']),
  w('ielts', 'assign', '/əˈsaɪn/', [['v.', '分配；指派；布置']], ['The teacher will assign a short essay.', '老师会布置一篇短文。'], 'assign A to B，把任务交给某人。', ['allocate', 'give']),
  w('ielts', 'atmosphere', '/ˈætməsfɪr/', [['n.', '大气；气氛']], ['The atmosphere in the hall was calm.', '大厅里的气氛很平静。'], '既是空气层，也是一个地方的感觉。', ['mood', 'air']),
  w('ielts', 'attain', '/əˈteɪn/', [['v.', '达到；获得']], ['She hopes to attain a higher score.', '她希望拿到更高的分数。'], '多指经过努力达到水平、职位或目标。', ['reach', 'achieve']),
  w('ielts', 'attitude', '/ˈætɪtuːd/', [['n.', '态度；看法']], ['His attitude toward failure is calm.', '他对失败的态度很平静。'], 'attitude to / toward sth。', ['view', 'outlook']),
  w('ielts', 'available', '/əˈveɪləbl/', [['adj.', '可获得的；有空的']], ['Tickets are available at the front desk.', '前台可以拿到票。'], '人有空、物可得到，都能用 available。', ['obtainable', 'free']),
  w('ielts', 'benefit', '/ˈbenɪfɪt/', [['n.', '益处'], ['v.', '有益于；受益']], ['Regular walks benefit people of all ages.', '经常走路对各个年龄的人都有好处。'], 'benefit from 从中受益；benefit sb 对某人有益。', ['advantage', 'help']),
  w('ielts', 'circumstance', '/ˈsɜːrkəmstæns/', [['n.', '情况；环境']], ['Each circumstance needs a different response.', '每种情况都需要不同的回应。'], '常用复数 circumstances 表示境况。', ['situation', 'condition']),
  w('ielts', 'clarify', '/ˈklærəfaɪ/', [['v.', '澄清；阐明']], ['Could you clarify the last point?', '你能把最后一点说清楚吗？'], 'clear 的动词形式，把模糊的地方讲明白。', ['explain', 'clear up']),
  w('ielts', 'collapse', '/kəˈlæps/', [['v.', '倒塌；崩溃'], ['n.', '倒塌']], ['The old bridge may collapse in a storm.', '这座旧桥在暴风雨里可能会塌。'], '建筑、系统、身体、谈判都可以 collapse。', ['fall', 'break down']),
  w('ielts', 'colleague', '/ˈkɑːliːɡ/', [['n.', '同事']], ['My colleague shared her notes.', '我的同事把笔记分享给了我。'], 'col- 一起 + league 结合，一起共事的人。', ['coworker', 'partner']),
  w('ielts', 'commence', '/kəˈmens/', [['v.', '开始']], ['The meeting will commence at nine.', '会议将在九点开始。'], '比 begin 更正式，写作和通知里常见。', ['begin', 'start']),
  w('ielts', 'compatible', '/kəmˈpætəbl/', [['adj.', '兼容的；合得来的']], ['The new app is compatible with my phone.', '这个新应用和我的手机兼容。'], 'compatible with。反义是 incompatible。', ['consistent', 'matching']),
];

export const wordById: Record<string, Word> = Object.fromEntries(words.map((word) => [word.id, word]));

export function wordsInBook(bookId: string): Word[] {
  return words.filter((word) => word.bookId === bookId);
}

export function bookById(bookId: string): Book {
  return books.find((book) => book.id === bookId) ?? books[0];
}
