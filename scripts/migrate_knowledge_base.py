#!/usr/bin/env python3
"""
知识库迁移脚本
从 chatbot-service 同步知识库内容到 1chatbot-service

功能：
1. 备份现有知识库文件
2. 从 chatbot-service 复制知识库到 1chatbot-service/projects
3. 同步知识库到 public 目录（静态网站访问）
4. 验证 JSON 文件格式
"""

import os
import shutil
import json
from pathlib import Path
from datetime import datetime

# 路径配置
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
SOURCE_DIR = PROJECT_ROOT.parent / "chatbot-service" / "projects"
TARGET_DIR = PROJECT_ROOT / "projects"
PUBLIC_DIR = PROJECT_ROOT / "public" / "projects"
BACKUP_DIR = PROJECT_ROOT / "projects_backup"

def validate_json(file_path: Path) -> tuple[bool, str]:
    """验证 JSON 文件格式"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            json.load(f)
        return True, ""
    except json.JSONDecodeError as e:
        return False, str(e)
    except Exception as e:
        return False, f"读取错误: {str(e)}"

def backup_existing_knowledge():
    """备份现有知识库"""
    if not TARGET_DIR.exists():
        print("⚠️  目标目录不存在，跳过备份")
        return
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"knowledge_backup_{timestamp}"
    
    print(f"\n📦 备份现有知识库到: {backup_path}")
    try:
        if backup_path.exists():
            shutil.rmtree(backup_path)
        shutil.copytree(TARGET_DIR, backup_path)
        print(f"✅ 备份完成: {len(list(backup_path.rglob('*.json')))} 个 JSON 文件")
    except Exception as e:
        print(f"⚠️  备份失败: {e}")

def get_projects_from_registry() -> list[str]:
    """从 registry.json 获取专案列表"""
    registry_file = SOURCE_DIR / "registry.json"
    if not registry_file.exists():
        print("⚠️  registry.json 不存在，使用目录扫描")
        return []
    
    try:
        with open(registry_file, 'r', encoding='utf-8') as f:
            registry = json.load(f)
        projects = [company['id'] for company in registry.get('companies', {}).values()]
        return projects
    except Exception as e:
        print(f"⚠️  读取 registry.json 失败: {e}")
        return []

def migrate_project_knowledge(project: str) -> dict:
    """迁移单个专案的知识库"""
    source_kb = SOURCE_DIR / project / "knowledge"
    target_kb = TARGET_DIR / project / "knowledge"
    public_kb = PUBLIC_DIR / project / "knowledge"
    
    result = {
        "project": project,
        "copied": 0,
        "errors": [],
        "files": []
    }
    
    if not source_kb.exists():
        result["errors"].append(f"源知识库不存在: {source_kb}")
        return result
    
    # 创建目标目录
    target_kb.mkdir(parents=True, exist_ok=True)
    public_kb.mkdir(parents=True, exist_ok=True)
    
    # 复制所有 JSON 文件
    json_files = list(source_kb.glob("*.json"))
    
    for json_file in json_files:
        try:
            # 复制到 projects 目录
            shutil.copy2(json_file, target_kb / json_file.name)
            # 复制到 public 目录
            shutil.copy2(json_file, public_kb / json_file.name)
            
            # 验证 JSON 格式
            is_valid, error_msg = validate_json(target_kb / json_file.name)
            if not is_valid:
                result["errors"].append(f"{json_file.name}: {error_msg}")
            else:
                result["copied"] += 1
                result["files"].append(json_file.name)
                
        except Exception as e:
            result["errors"].append(f"{json_file.name}: {str(e)}")
    
    return result

def create_manifest(project: str):
    """创建 _manifest.json 文件"""
    knowledge_dir = TARGET_DIR / project / "knowledge"
    public_knowledge_dir = PUBLIC_DIR / project / "knowledge"
    
    if not knowledge_dir.exists():
        return
    
    # 获取所有 JSON 文件
    json_files = sorted([f.name for f in knowledge_dir.glob("*.json") if not f.name.startswith("_")])
    
    manifest = {
        "version": "1.0.0",
        "last_updated": datetime.now().strftime("%Y-%m-%d"),
        "files": json_files
    }
    
    # 写入 manifest
    manifest_file = knowledge_dir / "_manifest.json"
    public_manifest_file = public_knowledge_dir / "_manifest.json"
    
    try:
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
        shutil.copy2(manifest_file, public_manifest_file)
    except Exception as e:
        print(f"⚠️  创建 manifest 失败 ({project}): {e}")

def main():
    """主函数"""
    print("=" * 60)
    print("知识库迁移脚本")
    print("=" * 60)
    print(f"源目录: {SOURCE_DIR}")
    print(f"目标目录: {TARGET_DIR}")
    print(f"公共目录: {PUBLIC_DIR}")
    print()
    
    # 检查源目录
    if not SOURCE_DIR.exists():
        print(f"❌ 错误: 源目录不存在: {SOURCE_DIR}")
        print("请确保 chatbot-service 项目在同一父目录下")
        return 1
    
    # 备份现有知识库
    backup_existing_knowledge()
    
    # 获取专案列表
    projects = get_projects_from_registry()
    if not projects:
        # 如果无法从 registry 获取，扫描目录
        projects = [d.name for d in SOURCE_DIR.iterdir() 
                   if d.is_dir() and (d / "knowledge").exists() 
                   and d.name != "templates" and d.name != "archived"]
    
    if not projects:
        print("❌ 未找到任何专案")
        return 1
    
    print(f"\n📋 找到 {len(projects)} 个专案: {', '.join(projects)}")
    print()
    
    # 迁移每个专案
    total_copied = 0
    total_errors = 0
    results = []
    
    for project in projects:
        print(f"🔄 迁移 {project}...")
        result = migrate_project_knowledge(project)
        results.append(result)
        
        if result["copied"] > 0:
            print(f"  ✅ 已复制 {result['copied']} 个文件")
            for file in result["files"]:
                print(f"     - {file}")
        
        if result["errors"]:
            print(f"  ⚠️  发现 {len(result['errors'])} 个错误:")
            for error in result["errors"]:
                print(f"     - {error}")
            total_errors += len(result["errors"])
        
        total_copied += result["copied"]
        
        # 创建 manifest
        create_manifest(project)
        print()
    
    # 总结
    print("=" * 60)
    print("迁移完成")
    print("=" * 60)
    print(f"✅ 成功复制: {total_copied} 个文件")
    if total_errors > 0:
        print(f"⚠️  错误数量: {total_errors}")
    print()
    
    # 显示详细结果
    print("详细结果:")
    for result in results:
        status = "✅" if result["copied"] > 0 and not result["errors"] else "⚠️"
        print(f"  {status} {result['project']}: {result['copied']} 个文件")
    
    return 0 if total_errors == 0 else 1

if __name__ == "__main__":
    exit(main())

