# ENUMA 宣传页 / 设计与迭代

## 当前版本：视频优先的研究展示

参考 [EchoWM](https://echo-team-joy-future-academy-jd.github.io/Echo-1.5-Page/wm/) 按能力组织的视频案例，以及 [Evoke](https://evoke-world.github.io/Evoke/) 的全屏动态首屏与大规模展示区。ENUMA 首页已调整为：骑士视频序列首屏 → 完整 Demo 视频 → 六个交互案例 → Ref2Vid / Text Event / Ref Event / Interaction / Embodied 五个独立章节 → 精简论文信息与 Benchmark 入口。交互案例区在桌面端排成两排、每排三个；Obsidian Portal 和 Drawbridge / Dragon 是四幕推进，Fireball / Brazier、Car Wash 和 Residential Street 是三幕推进；Plush Cow 是共享开场后选择 Pat / Lift / Drag 三条分支。具体视觉和文案保持 ENUMA 自己的风格，不复制同行品牌元素或性能叙述。

新增本地媒体通过 `prepare_media.py`、`prepare_hero_media.py`、`prepare_feature_media.py` 和 `prepare_capability_media.py` 从现有真实输出转码；六个互动页面均在 `interactive/`。

面向国际研究社区，以英文呈现。依据 `Unified_WM__tech_report_.pdf` 的摘要、Figure 1 和 Reference Forcing 章节组织内容，使用现有 ENUMA 标志与真实视频。

## 发布约定（用户已确认）

通过 GitHub Pages 发布：仓库根目录即网站（与 iMontage-web 相同），Pages 设置为 Deploy from a branch → `main` / `(root)`，每次推送到 `main` 自动更新 https://kr1sjfu.github.io/Enuma-web/ 。推送前运行 `verify_github_pages.py`。旧的 Sites 配置（`.openai/`）仅作历史记录。

## 视觉与叙事

核心句：**Worlds, in your hands.**

深黑底、冷白字体、少量浅绿交互色；以大幅世界画面建立第一印象，再逐层解释可控性和方法。视频承担视觉重点，避免用空泛技术指标、装饰仪表盘或假实时控制制造能力印象。

1. **世界入口**：八段选定骑士素材依次播放，最终由石狮连续接入动态论文 teaser 拼贴图并定格。
2. **Demo 正片**：第一个内容 section 播放完整 ENUMA v6 视频，用户点击后才加载。
3. **互动案例**：第二个内容 section 提供两个四幕体验、三个三幕体验（Fireball / Brazier、Car Wash、Residential Street）和一个 Pat / Lift / Drag 三分支体验，桌面端两排各三个。
4. **能力章节**：03 Ref2Vid、04 Text Event、05 Ref Event、06 Interaction、07 Embodied。五个章节的所有案例统一使用大画幅 16:9 横向滑窗，支持按钮翻页、触屏滑动和键盘方向键，当前分别容纳 16 / 16 / 8 / 8 / 8 个案例。Interaction 依次为取书（16 秒）、魔法盒、擦镜子、放小车、搅巧克力、擦面粉台面、开门、驾驶电动车。Ref2Vid 按时长分成各 8 个 30 秒与 8 秒案例；长片为 0264、0412、0256、0243、0825、0679、0757、0988，短片为 1、2、5、7、8、15、16、19。两组使用相同卡片排版并展示人物与场景参考图；30 秒案例在卡片中使用 8 秒预览，点击后播放完整片段。Text Event 同样分为 8 个 30 秒和 8 个 8 秒案例；长片选用 16、0152、0558、0584、0601、0627、0756、0131，排除 02、0136、0352、0559。长片卡片用事件附近的 8 秒预览，点击后播放完整片段。短片中彩绘玻璃和宫殿变霓虹使用去水印的 `-ezremove` 版本；按彩绘玻璃、灯塔流星、刺绣、仙侠飞鹤、冰变熔岩、金色信标、沙尘暴、宫殿变霓虹排序；灯塔流星从 30 秒原片连续截取第 10–18 秒。Ref Event 选用 new case 1–3 与 8s case 1、3、6、7、9，展示起始帧与事件参考图；new case 2 的参考图是根据视频重建，页面有相应标注。两类参考图都可点击查看原始分辨率，弹窗支持左右切换与键盘方向键。
5. **研究支撑**：08 精简论文摘要和独立 Benchmark 页面入口。

所有演示明确标注为预录。当前选项只切换视频，没有模型后端。

## 后续素材优先级

- **最优先：统一控制长片**。用同一次 rollout 连续展示镜头移动、语言事件、视觉参考事件；提供精确输入和事件发生时刻。这会比单独堆更多视频更有效地证明“统一”。
- **其次：30 秒因果生成**。目前 Ref2Vid 和 Text Event 已有完整 30 秒样例；后续可补充清晰的输入轨迹和事件时间轴。
- **随后：参考驱动事件的触发细节**。当前已放入起始帧、事件参考图和生成视频；拿到精确触发指令与时刻后再补充，进一步明确区别于 Ref2Vid。
- **最后：评测与发布信息**。确认最终表格、基线设置、作者顺序、论文地址与代码发布计划后再加入对应入口。现阶段不填入未经核对的性能数字或外部链接。

## 文件与维护

- `index.html`：页面结构与文案。
- `styles.css`：主题及响应式布局。
- `app.js`：首屏序列、Demo、能力章节视频与播放控制。
- `media-manifest.json`：网页媒体与原始素材的映射。
- `assets/`：网页副本。较长的 Demo 和部分首屏素材缩至网页适用分辨率；原始素材不修改。

参考输入来自 `iron_knight_contrast_04_anime_neon_metropolis` 的同名样例，未使用额外生成图片冒充 ENUMA 输出。暂未放入论文 PDF 下载，避免把设计稿中的报告入口误认为已经正式发布。

## 第二版：论文标题与 Benchmark 分页面

首页主标语下方加入完整标题 **ENUMA: Unifying Camera, Language, and Visual Controls for Interactive World Modeling**，作为可点击的论文信息。点击跳转到研究区并展开摘要。顶部导航和研究区均可进入独立的 `/benchmark/` 页面。

Benchmark 延续主站品牌，但采用更紧凑的研究页面布局：

- **Leaderboard**：依据报告 Section 5.3、Table 5 显示六个维度和八个方法。支持按指标组查看；分数尚未报告，全部以破折号显示，当前不作排名。真实分数接入后，指标列支持降序排序，缺失值排在最后。
- **Gallery**：六个任务分类筛选、四个现有视频布局示例、缺少素材分类的空状态。点击案例打开双栏比较布局：ENUMA 示例视频和等待配对结果的 baseline 区域。
- **Protocol**：说明六类任务测量的内容。评测案例数、最终评分流程和发布信息待确认。

Gallery 的现有素材明确标注为 illustrative demo，不能作为正式 benchmark 测试结果或与其他模型的匹配比较。

数据入口为 `benchmark/data.js`：维护 categories、models、examples。最终数值使用 0–100 的数字，未报告值使用 `null` 或缺省字段；不能以 0 代替缺失值。最终 benchmark 素材、baseline 结果和具体 section 由团队后续提供，再替换这版布局示例。
