import { getDb } from "../api/queries/connection";
import { posts, images, tags, postTags } from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Seed tags
  const tagData = [
    { name: "生活", color: "#FBBF24" },
    { name: "旅行", color: "#3B82F6" },
    { name: "随想", color: "#F472B6" },
    { name: "读书", color: "#4ADE80" },
    { name: "日常", color: "#A78BFA" },
  ];
  const insertedTags = await db.insert(tags).values(tagData);
  console.log("Inserted tags:", tagData.length);

  // Seed blog posts
  const blogPosts = [
    {
      title: "关于慢生活的思考",
      content: "在这个快节奏的世界里，我们似乎总是在追赶什么。但我越来越发现，真正让生活有意义的，往往是那些慢下来的时刻。\n\n一杯手冲咖啡的香气，一本纸质书的触感，一段独自散步的宁静。这些看似微不足道的瞬间，拼凑出了生活的质感。\n\n我开始尝试每天留出至少一个小时的「无目的时间」——不看手机，不想待办事项，只是做当下想做的事。有时是整理书桌，有时是盯着窗外发呆，有时是给远方的朋友写一封信。\n\n这些时刻让我重新找到了内心的秩序。",
      type: "blog" as const,
      slug: "slow-life-thinking",
      status: "published" as const,
    },
    {
      title: "我的阅读清单：2024年春",
      content: "春天是读书的好季节。以下是我最近读完和正在读的书：\n\n**已读完：**\n- 《悉达多》—— 赫尔曼·黑塞\n- 《阿勒泰的角落》—— 李娟\n- 《纳瓦尔宝典》—— 埃里克·乔根森\n\n**正在读：**\n- 《人类简史》—— 尤瓦尔·赫拉利\n- 《设计心理学》—— 唐纳德·诺曼\n\n每本书都像是一次新的旅行，带我进入不同的世界。",
      type: "blog" as const,
      slug: "reading-list-2024-spring",
      status: "published" as const,
    },
    {
      title: "从零开始的咖啡之旅",
      content: "三个月前，我连速溶咖啡和挂耳咖啡都分不清。现在，我已经能在家做出一杯像样的手冲了。\n\n学习的过程充满乐趣：从了解不同产地的豆子风味，到练习注水的水流控制，再到调整研磨度。每一个变量都会影响最终的口感。\n\n最重要的是，这个过程教会了我耐心。一杯好咖啡需要等待——等水温降到合适的范围，等咖啡粉充分焖蒸，等最后几滴落下。\n\n这大概也是生活的隐喻吧。",
      type: "blog" as const,
      slug: "coffee-journey-beginner",
      status: "published" as const,
    },
  ];

  for (const post of blogPosts) {
    const result = await db.insert(posts).values(post);
    const postId = Number(result[0].insertId);
    await db.insert(postTags).values([
      { postId, tagId: 1 },
      { postId, tagId: postId <= 2 ? 2 : 4 },
    ]);
  }
  console.log("Inserted blog posts:", blogPosts.length);

  // Seed journal entries
  const journalEntries = [
    {
      title: "4月23日 晴",
      content: "今天天气很好。早上七点自然醒，拉开窗帘看到满眼的绿色。泡了一杯绿茶，坐在窗边看了一会儿云。\n\n下午去附近的公园散步，发现樱花已经落得差不多了，但杜鹃开得正艳。一位老爷爷在湖边喂鸭子，看到我笑了笑，我也笑了笑。\n\n晚上做了番茄鸡蛋面，简单但满足。",
      type: "journal" as const,
      slug: "journal-2024-04-23",
      status: "published" as const,
    },
    {
      title: "4月20日 雨",
      content: " raining all day. 这样的天气最适合窝在家里，听雨声，看一部老电影。\n\n今天重温了《海街日记》，第三次看了，还是觉得温暖。四姐妹的日常，平淡中蕴含着最深的情感。\n\n下午整理了一下衣柜，把冬天的衣服收起来，春夏的衣服拿出来。换季总是让人有一种新生的感觉。\n\n晚上尝试做了新的菜谱——奶油蘑菇汤，味道还不错。",
      type: "journal" as const,
      slug: "journal-2024-04-20",
      status: "published" as const,
    },
    {
      title: "4月15日 多云",
      content: "今天去了图书馆，借了三本书。图书馆的氛围总是让人平静——翻书的声音、轻微的脚步声、偶尔传来的咳嗽声。\n\n在回来的路上，买了一束洋桔梗，淡紫色的，插在书桌上的花瓶里。房间里顿时多了一份生气。\n\n晚上给好久不见的朋友打了通电话，聊了两个小时。友谊就是这样，即使很久不见，一开口还是熟悉的感觉。",
      type: "journal" as const,
      slug: "journal-2024-04-15",
      status: "published" as const,
    },
  ];

  for (const entry of journalEntries) {
    await db.insert(posts).values(entry);
  }
  console.log("Inserted journal entries:", journalEntries.length);

  // Seed thoughts
  const thoughts = [
    {
      title: "关于孤独的碎片",
      content: "孤独不是一种状态，而是一种能力。能够与自己相处的人，才能真正与他人相处。",
      type: "thought" as const,
      slug: "thought-loneliness",
      status: "published" as const,
    },
    {
      title: "今天的感悟",
      content: "最好的旅行不是去最远的地方，而是用最近的目光重新审视熟悉的一切。",
      type: "thought" as const,
      slug: "thought-travel",
      status: "published" as const,
    },
    {
      title: "一个想法",
      content: "生活就像拍照，有时候需要换个角度，才能发现不一样的美。",
      type: "thought" as const,
      slug: "thought-perspective",
      status: "published" as const,
    },
  ];

  for (const thought of thoughts) {
    await db.insert(posts).values(thought);
  }
  console.log("Inserted thoughts:", thoughts.length);

  // Seed gallery images
  const galleryImages = [
    {
      title: "春日樱花",
      description: "「2024年春，家附近的公园樱花盛开，阳光透过花瓣呈现出半透明的质感。」",
      url: "/photo-spring.jpg",
      album: "摄影",
    },
    {
      title: "蓝色静物",
      description: "「极简主义色彩练习，橙子与克莱因蓝的对撞。」",
      url: "/photo-orange.jpg",
      album: "摄影",
    },
    {
      title: "日落海边",
      description: "「金色的黄昏，海浪与飞鸟。」",
      url: "/photo-sea.jpg",
      album: "旅行",
    },
    {
      title: "秋日小径",
      description: "「铺满落叶的林间小道，秋天独有的温柔。」",
      url: "/photo-autumn.jpg",
      album: "旅行",
    },
    {
      title: "熟睡的小猫",
      description: "「画了一只打盹的橘猫，希望能给你带来片刻的宁静。」",
      url: "/photo-cat.png",
      album: "插画",
    },
  ];

  await db.insert(images).values(galleryImages);
  console.log("Inserted gallery images:", galleryImages.length);

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
