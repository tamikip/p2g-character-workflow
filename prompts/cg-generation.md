# Prompt Template: CG Generation

## Goal
Generate two randomized CG scenes while keeping the same character identity and making the scene fit the character.

## Current Template Logic
- Keep the same character identity, hairstyle, facial features, clothing, accessories, colors, and art style.
- Infer the character's tone, role, and world from the reference image before deciding how to stage the CG scene.
- Use a randomized scene pool instead of a fixed library / study-room template.
- Keep the character as a single subject and avoid identity drift.

## Current Core Prompt
请保持同一角色的人设、发型、五官、服装、配饰、配色与画风一致。  
必须是单人角色，不要新增人物。  
不要改变角色年龄感、体型、服装款式、发型结构和标志性配饰。  
你需要先根据参考角色图自行判断角色的气质、题材、作品类型、服装用途和世界观氛围，再在不违和的前提下设计场景。  
场景必须贴合该角色，而不是套用固定模板或通用图书馆场景。  
允许构图、镜头、光线、道具和环境细节自然变化，但角色身份必须保持一致。  
输出完整单张成图，不需要透明背景。  
负面：多人、文字、水印、裁切、畸形手、多肢、模糊、低清晰度、换装、变发型、变配饰、人物不一致。

## Example Scene Pool
- 清晨轻轨车厢里靠窗看资料，冷色城市晨光掠过脸和手中的纸页
- 雨后便利店门口短暂停留，霓虹和街灯在地面反光，角色抱着学习资料
- 展会后台整理笔记和设备，局部射灯照亮桌面、徽章和随身物件
- 安静咖啡馆角落快速复盘，桌上散着便签、平板和半杯饮品
- 天台傍晚迎风翻看资料，远处城市灯光渐亮，风吹动发梢和衣角
