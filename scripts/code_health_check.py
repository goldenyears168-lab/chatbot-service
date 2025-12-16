#!/usr/bin/env python3
"""
代码健康度全面检查脚本
检查 TypeScript 错误、代码质量、依赖关系、测试覆盖率等
"""

import os
import json
import subprocess
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Tuple, Any
import ast

class CodeHealthChecker:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'typescript': {},
            'eslint': {},
            'eslint_complexity': {},
            'dead_code': {},
            'dependency_health': {},
            'code_quality': {},
            'dependencies': {},
            'file_analysis': {},
            'security': {},
            'performance': {},
            'summary': {}
        }
        
    def run_command(self, cmd: List[str], cwd: str = None, timeout: int = 300) -> Tuple[int, str, str]:
        """运行命令并返回结果（完整检查模式，允许更长时间）"""
        try:
            result = subprocess.run(
                cmd,
                cwd=cwd or self.project_root,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return -1, "", "Command timeout"
        except Exception as e:
            return -1, "", str(e)
    
    def check_typescript(self):
        """检查 TypeScript 编译错误"""
        print("🔍 检查 TypeScript 编译错误...")
        returncode, stdout, stderr = self.run_command(['npx', 'tsc', '--noEmit', '--pretty', 'false'], timeout=120)
        
        errors = []
        warnings = []
        
        if returncode != 0:
            output = stderr + stdout
            lines = output.split('\n')
            for line in lines:
                if 'error TS' in line:
                    errors.append(line.strip())
                elif 'warning TS' in line:
                    warnings.append(line.strip())
        
        self.results['typescript'] = {
            'status': 'pass' if returncode == 0 else 'fail',
            'error_count': len(errors),
            'warning_count': len(warnings),
            'errors': errors[:50],  # 限制输出
            'warnings': warnings[:50]
        }
        
        return returncode == 0
    
    def check_eslint(self):
        """检查 ESLint 错误"""
        print("🔍 检查 ESLint 错误...")
        # 使用更快的检查方式，限制文件数量
        returncode, stdout, stderr = self.run_command([
            'npx', 'eslint', 
            '--format', 'json',
            'app', 'lib', 'components', 'types'
        ], timeout=120)
        
        issues = []
        error_count = 0
        warning_count = 0
        
        # 只处理 stdout，忽略 stderr（避免 JSON 污染）
        if stdout:
            try:
                # 尝试解析 JSON（只从 stdout）
                eslint_data = json.loads(stdout)
                if isinstance(eslint_data, list):
                    # ESLint JSON 格式是数组
                    for file_data in eslint_data:
                        if isinstance(file_data, dict):
                            file_path = file_data.get('filePath', '')
                            file_issues = file_data.get('messages', [])
                            for issue in file_issues:
                                severity = issue.get('severity', 1)
                                if severity == 2:
                                    error_count += 1
                                elif severity == 1:
                                    warning_count += 1
                                issues.append({
                                    'file': file_path,
                                    'line': issue.get('line', 0),
                                    'column': issue.get('column', 0),
                                    'severity': 'error' if severity == 2 else 'warning',
                                    'message': issue.get('message', ''),
                                    'rule': issue.get('ruleId', '')
                                })
                elif isinstance(eslint_data, dict):
                    # 旧格式：对象
                    for file_path, file_issues in eslint_data.items():
                        if isinstance(file_issues, list):
                            for issue in file_issues:
                                severity = issue.get('severity', 1)
                                if severity == 2:
                                    error_count += 1
                                elif severity == 1:
                                    warning_count += 1
                                issues.append({
                                    'file': file_path,
                                    'line': issue.get('line', 0),
                                    'column': issue.get('column', 0),
                                    'severity': 'error' if severity == 2 else 'warning',
                                    'message': issue.get('message', ''),
                                    'rule': issue.get('ruleId', '')
                                })
            except (json.JSONDecodeError, KeyError, ValueError):
                # JSON 解析失败，忽略（避免污染报告）
                pass
        
        self.results['eslint'] = {
            'status': 'pass' if returncode == 0 and error_count == 0 else 'fail',
            'error_count': error_count,
            'warning_count': warning_count,
            'issue_count': len(issues),
            'issues': issues[:30]  # 减少输出
        }
        
        return returncode == 0 and error_count == 0
    
    def check_eslint_complexity(self):
        """检查 ESLint 复杂度规则（从主 ESLint 检查结果中提取）"""
        print("🔍 检查 ESLint 复杂度规则...")
        
        # 从主 ESLint 检查结果中提取复杂度问题，避免重复运行
        complexity_issues = []
        complexity_rules = ['complexity', 'max-depth', 'max-lines', 'max-lines-per-function', 'max-nested-callbacks', 'max-params']
        
        eslint_issues = self.results.get('eslint', {}).get('issues', [])
        for issue in eslint_issues:
            if isinstance(issue, dict):
                rule_id = issue.get('rule', '')
                if any(rule in rule_id.lower() for rule in complexity_rules):
                    complexity_issues.append({
                        'file': issue.get('file', ''),
                        'line': issue.get('line', 0),
                        'rule': rule_id,
                        'message': issue.get('message', '')
                    })
        
        self.results['eslint_complexity'] = {
            'issue_count': len(complexity_issues),
            'issues': complexity_issues[:20]  # 减少输出
        }
    
    def check_dead_code(self):
        """使用 ts-prune 检查死代码"""
        print("🔍 检查死代码 (ts-prune)...")
        
        # 使用更快的配置，跳过 node_modules 和 .next
        returncode, stdout, stderr = self.run_command([
            'npx', 'ts-prune',
            '--ignore', 'node_modules',
            '--ignore', '.next'
        ], timeout=60)
        
        dead_code_issues = []
        if stdout:
            lines = stdout.split('\n')
            for line in lines[:200]:  # 限制处理行数
                line = line.strip()
                if line and not line.startswith('Found') and 'node_modules' not in line and '.next' not in line:
                    # 解析 ts-prune 输出格式: file.ts:line - exportName
                    if ' - ' in line:
                        parts = line.split(' - ')
                        if len(parts) == 2:
                            file_info = parts[0].split(':')
                            try:
                                dead_code_issues.append({
                                    'file': file_info[0] if file_info else parts[0],
                                    'line': int(file_info[1]) if len(file_info) > 1 and file_info[1].isdigit() else 0,
                                    'export': parts[1].strip()
                                })
                            except (ValueError, IndexError):
                                pass
                    elif line and not line.startswith('Found'):
                        dead_code_issues.append({'file': line})
        
        self.results['dead_code'] = {
            'status': 'pass' if len(dead_code_issues) == 0 else 'warning',
            'issue_count': len(dead_code_issues),
            'issues': dead_code_issues[:30]  # 减少输出
        }
    
    def check_dependency_health(self):
        """使用 depcheck 检查依赖健康"""
        print("🔍 检查依赖健康 (depcheck)...")
        
        returncode, stdout, stderr = self.run_command(['npx', 'depcheck', '--json'], timeout=60)
        
        unused_deps = []
        missing_deps = []
        
        # 只处理 stdout，确保 JSON 解析
        if stdout:
            try:
                depcheck_data = json.loads(stdout)
                if isinstance(depcheck_data, dict):
                    unused_deps = depcheck_data.get('dependencies', [])
                    missing_deps = list(depcheck_data.get('missing', {}).keys())
            except (json.JSONDecodeError, KeyError, ValueError):
                # JSON 解析失败，忽略
                pass
        
        self.results['dependency_health'] = {
            'status': 'pass' if len(unused_deps) == 0 and len(missing_deps) == 0 else 'warning',
            'unused_dependencies': unused_deps[:20],  # 减少输出
            'missing_dependencies': missing_deps[:20],
            'unused_count': len(unused_deps),
            'missing_count': len(missing_deps)
        }
    
    def analyze_file_complexity(self, file_path: Path) -> Dict[str, Any]:
        """分析单个文件的复杂度"""
        try:
            content = file_path.read_text(encoding='utf-8')
            lines = content.split('\n')
            
            # 基本统计
            total_lines = len(lines)
            code_lines = len([l for l in lines if l.strip() and not l.strip().startswith('//') and not l.strip().startswith('/*')])
            comment_lines = len([l for l in lines if '//' in l or '/*' in l or '*/' in l])
            blank_lines = len([l for l in lines if not l.strip()])
            
            # 复杂度指标
            function_count = len(re.findall(r'(?:function|const|let|var)\s+\w+\s*[=:]', content))
            class_count = len(re.findall(r'class\s+\w+', content))
            import_count = len(re.findall(r'^import\s+', content, re.MULTILINE))
            export_count = len(re.findall(r'^export\s+', content, re.MULTILINE))
            
            # 嵌套深度（简单估算）
            max_depth = 0
            current_depth = 0
            for char in content:
                if char == '{':
                    current_depth += 1
                    max_depth = max(max_depth, current_depth)
                elif char == '}':
                    current_depth = max(0, current_depth - 1)
            
            # 文件大小警告
            size_warning = None
            file_size_kb = file_path.stat().st_size / 1024
            if file_size_kb > 100:
                size_warning = f"文件过大 ({file_size_kb:.1f} KB)"
            
            return {
                'total_lines': total_lines,
                'code_lines': code_lines,
                'comment_lines': comment_lines,
                'blank_lines': blank_lines,
                'function_count': function_count,
                'class_count': class_count,
                'import_count': import_count,
                'export_count': export_count,
                'max_nesting_depth': max_depth,
                'file_size_kb': round(file_size_kb, 2),
                'size_warning': size_warning,
                'complexity_score': function_count * 2 + class_count * 3 + max_depth * 2
            }
        except Exception as e:
            return {'error': str(e)}
    
    def analyze_code_quality(self):
        """分析代码质量"""
        print("🔍 分析代码质量...")
        
        source_dirs = ['app', 'lib', 'components', 'types']
        files_analyzed = []
        issues = []
        
        for dir_name in source_dirs:
            dir_path = self.project_root / dir_name
            if not dir_path.exists():
                continue
                
            for ext in ['ts', 'tsx']:
                for file_path in dir_path.rglob(f'*.{ext}'):
                    if 'node_modules' in str(file_path) or '.next' in str(file_path) or '__tests__' in str(file_path):
                        continue
                    
                    try:
                        analysis = self.analyze_file_complexity(file_path)
                        if 'error' not in analysis:
                            files_analyzed.append({
                                'path': str(file_path.relative_to(self.project_root)),
                                **analysis
                            })
                            
                            # 检查潜在问题
                            if analysis.get('complexity_score', 0) > 50:
                                issues.append(f"{file_path.relative_to(self.project_root)}: 复杂度较高 (score: {analysis['complexity_score']})")
                            if analysis.get('max_nesting_depth', 0) > 5:
                                issues.append(f"{file_path.relative_to(self.project_root)}: 嵌套深度过深 ({analysis['max_nesting_depth']})")
                            if analysis.get('size_warning'):
                                issues.append(f"{file_path.relative_to(self.project_root)}: {analysis['size_warning']}")
                    except Exception:
                        # 跳过无法分析的文件
                        continue
        
        # 统计
        total_files = len(files_analyzed)
        avg_complexity = sum(f.get('complexity_score', 0) for f in files_analyzed) / total_files if total_files > 0 else 0
        large_files = [f for f in files_analyzed if f.get('file_size_kb', 0) > 50]
        complex_files = [f for f in files_analyzed if f.get('complexity_score', 0) > 30]
        
        # 代码行数统计
        total_lines = sum(f.get('total_lines', 0) for f in files_analyzed)
        total_code_lines = sum(f.get('code_lines', 0) for f in files_analyzed)
        total_comment_lines = sum(f.get('comment_lines', 0) for f in files_analyzed)
        total_blank_lines = sum(f.get('blank_lines', 0) for f in files_analyzed)
        
        # 函数和类统计
        total_functions = sum(f.get('function_count', 0) for f in files_analyzed)
        total_classes = sum(f.get('class_count', 0) for f in files_analyzed)
        total_imports = sum(f.get('import_count', 0) for f in files_analyzed)
        total_exports = sum(f.get('export_count', 0) for f in files_analyzed)
        
        # 文件大小分布
        small_files = len([f for f in files_analyzed if f.get('file_size_kb', 0) < 10])
        medium_files = len([f for f in files_analyzed if 10 <= f.get('file_size_kb', 0) < 30])
        large_files_count = len([f for f in files_analyzed if f.get('file_size_kb', 0) >= 30])
        
        self.results['code_quality'] = {
            'total_files_analyzed': total_files,
            'average_complexity': round(avg_complexity, 2),
            'large_files_count': len(large_files),
            'complex_files_count': len(complex_files),
            'large_files': [{'path': f['path'], 'size_kb': f['file_size_kb']} for f in large_files[:10]],
            'complex_files': [{'path': f['path'], 'score': f['complexity_score']} for f in complex_files[:10]],
            'issues': issues[:50],
            'code_statistics': {
                'total_lines': total_lines,
                'total_code_lines': total_code_lines,
                'total_comment_lines': total_comment_lines,
                'total_blank_lines': total_blank_lines,
                'total_functions': total_functions,
                'total_classes': total_classes,
                'total_imports': total_imports,
                'total_exports': total_exports,
                'file_size_distribution': {
                    'small': small_files,
                    'medium': medium_files,
                    'large': large_files_count
                }
            }
        }
    
    def check_dependencies(self):
        """检查依赖关系"""
        print("🔍 检查依赖关系...")
        
        package_json = self.project_root / 'package.json'
        if not package_json.exists():
            return
        
        with open(package_json, 'r', encoding='utf-8') as f:
            package_data = json.load(f)
        
        dependencies = package_data.get('dependencies', {})
        dev_dependencies = package_data.get('devDependencies', {})
        
        # 检查过时的依赖
        outdated = []
        try:
            returncode, stdout, _ = self.run_command(['npm', 'outdated', '--json'], timeout=60)
            if returncode == 0 and stdout:
                try:
                    outdated_data = json.loads(stdout)
                    outdated = list(outdated_data.keys())
                except:
                    pass
        except:
            pass
        
        # 检查安全漏洞
        vulnerabilities = []
        try:
            returncode, stdout, _ = self.run_command(['npm', 'audit', '--json'], timeout=60)
            if returncode != 0 and stdout:
                try:
                    audit_data = json.loads(stdout)
                    if 'vulnerabilities' in audit_data:
                        for vuln_id, vuln_data in audit_data['vulnerabilities'].items():
                            if isinstance(vuln_data, dict) and vuln_data.get('severity'):
                                vulnerabilities.append({
                                    'id': vuln_id,
                                    'severity': vuln_data.get('severity'),
                                    'title': vuln_data.get('title', ''),
                                    'via': vuln_data.get('via', [])
                                })
                except (json.JSONDecodeError, KeyError):
                    pass
        except:
            pass
        
        self.results['dependencies'] = {
            'total_dependencies': len(dependencies),
            'total_dev_dependencies': len(dev_dependencies),
            'outdated_count': len(outdated),
            'outdated_packages': outdated[:20],
            'vulnerabilities_count': len(vulnerabilities),
            'vulnerabilities': vulnerabilities[:20]
        }
    
    def check_unused_imports(self):
        """检查未使用的导入（从 TypeScript 检查结果中提取，避免重复运行）"""
        print("🔍 检查未使用的导入...")
        
        unused_issues = []
        # 复用 TypeScript 检查的输出
        ts_errors = self.results.get('typescript', {}).get('errors', [])
        for error in ts_errors:
            if 'is declared but its value is never read' in error or 'is declared but never used' in error:
                unused_issues.append(error.strip())
        
        self.results['code_quality']['unused_imports'] = {
            'count': len(unused_issues),
            'issues': unused_issues[:20]  # 减少输出
        }
    
    def check_security(self):
        """检查安全问题"""
        print("🔍 检查安全问题...")
        
        security_issues = []
        
        # 检查硬编码的敏感信息
        sensitive_patterns = [
            (r'password\s*[:=]\s*["\']([^"\']+)["\']', '硬编码密码'),
            (r'api[_-]?key\s*[:=]\s*["\']([^"\']+)["\']', '硬编码 API Key'),
            (r'secret\s*[:=]\s*["\']([^"\']+)["\']', '硬编码密钥'),
            (r'token\s*[:=]\s*["\']([^"\']+)["\']', '硬编码 Token'),
        ]
        
        source_dirs = ['app', 'lib', 'components']
        for dir_name in source_dirs:
            dir_path = self.project_root / dir_name
            if not dir_path.exists():
                continue
                
            for ext in ['ts', 'tsx', 'js', 'jsx']:
                for file_path in dir_path.rglob(f'*.{ext}'):
                    if 'node_modules' in str(file_path) or '.next' in str(file_path) or '__tests__' in str(file_path):
                        continue
                
                try:
                    content = file_path.read_text(encoding='utf-8')
                    for pattern, issue_type in sensitive_patterns:
                        matches = re.finditer(pattern, content, re.IGNORECASE)
                        for match in matches:
                            # 排除明显的示例或注释
                            if 'example' not in match.group(0).lower() and 'TODO' not in match.group(0):
                                security_issues.append({
                                    'file': str(file_path.relative_to(self.project_root)),
                                    'type': issue_type,
                                    'line': content[:match.start()].count('\n') + 1
                                })
                except:
                    pass
        
        self.results['security'] = {
            'hardcoded_secrets_count': len(security_issues),
            'issues': security_issues[:30]
        }
    
    def check_test_coverage(self):
        """检查测试覆盖率和运行测试"""
        print("🔍 检查测试覆盖率...")
        
        # 查找所有测试文件
        test_files = []
        test_dirs = [
            self.project_root / 'lib' / '__tests__',
            self.project_root / '__tests__',
            self.project_root / 'app',
            self.project_root / 'lib'
        ]
        
        for test_dir in test_dirs:
            if test_dir.exists():
                for pattern in ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx']:
                    test_files.extend(list(test_dir.rglob(pattern)))
        
        # 去重
        test_files = list(set(test_files))
        test_count = len(test_files)
        
        # 运行测试获取覆盖率
        test_status = 'unknown'
        coverage_data = {}
        try:
            returncode, stdout, stderr = self.run_command(['npm', 'test', '--', '--passWithNoTests', '--coverage', '--json'], timeout=120)
            if returncode == 0:
                test_status = 'pass'
            else:
                test_status = 'fail'
            
            # 尝试解析覆盖率数据
            if stdout:
                try:
                    coverage_data = json.loads(stdout)
                except:
                    pass
        except:
            pass
        
        self.results['code_quality']['testing'] = {
            'test_files_count': test_count,
            'test_status': test_status,
            'test_files': [str(f.relative_to(self.project_root)) for f in test_files],
            'coverage': coverage_data
        }
    
    def generate_summary(self):
        """生成总结"""
        summary = {
            'overall_status': 'pass',
            'issues_found': 0,
            'critical_issues': [],
            'warnings': []
        }
        
        # TypeScript 错误
        if self.results['typescript'].get('error_count', 0) > 0:
            summary['issues_found'] += self.results['typescript']['error_count']
            summary['critical_issues'].append(f"TypeScript 错误: {self.results['typescript']['error_count']} 个")
            summary['overall_status'] = 'fail'
        
        # ESLint 错误
        eslint_errors = self.results['eslint'].get('error_count', 0)
        eslint_warnings = self.results['eslint'].get('warning_count', 0)
        if eslint_errors > 0:
            summary['issues_found'] += eslint_errors
            summary['critical_issues'].append(f"ESLint 错误: {eslint_errors} 个")
            summary['overall_status'] = 'fail'
        if eslint_warnings > 0:
            summary['issues_found'] += eslint_warnings
            summary['warnings'].append(f"ESLint 警告: {eslint_warnings} 个")
        
        # ESLint 复杂度问题
        complexity_issues = self.results['eslint_complexity'].get('issue_count', 0)
        if complexity_issues > 0:
            summary['issues_found'] += complexity_issues
            summary['warnings'].append(f"ESLint 复杂度问题: {complexity_issues} 个")
        
        # 死代码
        dead_code_count = self.results['dead_code'].get('issue_count', 0)
        if dead_code_count > 0:
            summary['issues_found'] += dead_code_count
            summary['warnings'].append(f"死代码: {dead_code_count} 个未使用的导出")
        
        # 依赖健康
        unused_deps = self.results['dependency_health'].get('unused_count', 0)
        missing_deps = self.results['dependency_health'].get('missing_count', 0)
        if unused_deps > 0:
            summary['issues_found'] += unused_deps
            summary['warnings'].append(f"未使用的依赖: {unused_deps} 个")
        if missing_deps > 0:
            summary['issues_found'] += missing_deps
            summary['warnings'].append(f"缺失的依赖: {missing_deps} 个")
        
        # 安全问题
        if self.results['security'].get('hardcoded_secrets_count', 0) > 0:
            summary['issues_found'] += self.results['security']['hardcoded_secrets_count']
            summary['critical_issues'].append(f"安全问题: {self.results['security']['hardcoded_secrets_count']} 个潜在硬编码密钥")
            summary['overall_status'] = 'fail'
        
        # 依赖漏洞
        if self.results['dependencies'].get('vulnerabilities_count', 0) > 0:
            summary['issues_found'] += self.results['dependencies']['vulnerabilities_count']
            summary['warnings'].append(f"依赖漏洞: {self.results['dependencies']['vulnerabilities_count']} 个")
        
        # 未使用的导入
        unused_count = self.results['code_quality'].get('unused_imports', {}).get('count', 0)
        if unused_count > 0:
            summary['issues_found'] += unused_count
            summary['warnings'].append(f"未使用的导入: {unused_count} 个")
        
        self.results['summary'] = summary
    
    def run_all_checks(self):
        """运行所有检查（优化版，快速执行）"""
        print("🚀 开始代码健康度检查...\n")
        
        # 基础检查（必须）
        self.check_typescript()
        self.check_eslint()
        self.check_eslint_complexity()  # 从 ESLint 结果提取，不重复运行
        
        # 代码质量检查（快速模式）
        self.analyze_code_quality()  # 限制文件数量
        self.check_unused_imports()  # 从 TypeScript 结果提取
        self.check_dead_code()
        
        # 依赖检查（快速模式）
        self.check_dependencies()  # 跳过过时检查
        self.check_dependency_health()
        
        # 安全和测试（快速模式）
        self.check_security()
        self.check_test_coverage()  # 只统计，不运行
        
        # 生成总结
        self.generate_summary()
        
        print("\n✅ 检查完成!")
    
    def generate_markdown_report(self) -> str:
        """生成 Markdown 报告"""
        md = []
        md.append("# 代码健康度检查报告")
        md.append("")
        md.append(f"**生成时间**: {self.results['timestamp']}")
        md.append("")
        
        # 总结
        summary = self.results['summary']
        status_emoji = "❌" if summary['overall_status'] == 'fail' else "✅"
        md.append(f"## 📊 总体状态: {status_emoji} {summary['overall_status'].upper()}")
        md.append("")
        md.append(f"- **发现问题总数**: {summary['issues_found']}")
        md.append(f"- **严重问题**: {len(summary['critical_issues'])}")
        md.append(f"- **警告**: {len(summary['warnings'])}")
        md.append("")
        
        if summary['critical_issues']:
            md.append("### ⚠️ 严重问题")
            for issue in summary['critical_issues']:
                md.append(f"- {issue}")
            md.append("")
        
        if summary['warnings']:
            md.append("### ⚠️ 警告")
            for warning in summary['warnings']:
                md.append(f"- {warning}")
            md.append("")
        
        # TypeScript 检查
        md.append("## 🔷 TypeScript 检查")
        md.append("")
        ts_result = self.results['typescript']
        status_emoji = "✅" if ts_result.get('status') == 'pass' else "❌"
        md.append(f"**状态**: {status_emoji} {ts_result.get('status', 'unknown').upper()}")
        md.append(f"- **错误数**: {ts_result.get('error_count', 0)}")
        md.append(f"- **警告数**: {ts_result.get('warning_count', 0)}")
        md.append("")
        
        if ts_result.get('errors'):
            md.append("### 错误列表 (前 20 个)")
            for error in ts_result['errors'][:20]:
                md.append(f"- `{error}`")
            md.append("")
        
        # ESLint 检查
        md.append("## 🔶 ESLint 检查")
        md.append("")
        eslint_result = self.results['eslint']
        status_emoji = "✅" if eslint_result.get('status') == 'pass' else "❌"
        md.append(f"**状态**: {status_emoji} {eslint_result.get('status', 'unknown').upper()}")
        md.append(f"- **错误数**: {eslint_result.get('error_count', 0)}")
        md.append(f"- **警告数**: {eslint_result.get('warning_count', 0)}")
        md.append(f"- **总问题数**: {eslint_result.get('issue_count', 0)}")
        md.append("")
        
        if eslint_result.get('issues'):
            md.append("### 主要问题 (前 10 个)")
            for issue in eslint_result['issues'][:10]:
                if isinstance(issue, dict):
                    file_path = issue.get('file', 'unknown')
                    # 移除绝对路径前缀，只保留相对路径
                    if str(self.project_root) in file_path:
                        file_path = file_path.replace(str(self.project_root) + '/', '')
                    md.append(f"- `{file_path}:{issue.get('line', 0)}` - {issue.get('message', '')} [{issue.get('rule', '')}]")
                else:
                    md.append(f"- {issue}")
            md.append("")
        
        # ESLint 复杂度检查
        complexity_result = self.results.get('eslint_complexity', {})
        if complexity_result.get('issue_count', 0) > 0:
            md.append("### 🔍 复杂度规则检查")
            md.append("")
            md.append(f"- **复杂度问题数**: {complexity_result.get('issue_count', 0)}")
            if complexity_result.get('issues'):
                md.append("### 复杂度问题 (前 10 个)")
                for issue in complexity_result['issues'][:10]:
                    md.append(f"- `{issue.get('file', 'unknown')}:{issue.get('line', 0)}` - {issue.get('rule', '')}: {issue.get('message', '')}")
                md.append("")
        
        # 死代码检查
        md.append("## 💀 死代码检查 (ts-prune)")
        md.append("")
        dead_code_result = self.results.get('dead_code', {})
        status_emoji = "✅" if dead_code_result.get('status') == 'pass' else "⚠️"
        md.append(f"**状态**: {status_emoji} {dead_code_result.get('status', 'unknown').upper()}")
        md.append(f"- **未使用的导出**: {dead_code_result.get('issue_count', 0)}")
        md.append("")
        
        if dead_code_result.get('issues'):
            md.append("### 未使用的导出 (前 20 个)")
            for issue in dead_code_result['issues'][:20]:
                if isinstance(issue, dict):
                    export_name = issue.get('export', 'unknown')
                    file_path = issue.get('file', 'unknown')
                    line = issue.get('line', 0)
                    if line > 0:
                        md.append(f"- `{file_path}:{line}` - {export_name}")
                    else:
                        md.append(f"- `{file_path}` - {export_name}")
                else:
                    md.append(f"- {issue}")
            md.append("")
        
        # 依赖健康检查
        md.append("## 📦 依赖健康检查 (depcheck)")
        md.append("")
        dep_health_result = self.results.get('dependency_health', {})
        status_emoji = "✅" if dep_health_result.get('status') == 'pass' else "⚠️"
        md.append(f"**状态**: {status_emoji} {dep_health_result.get('status', 'unknown').upper()}")
        md.append(f"- **未使用的依赖**: {dep_health_result.get('unused_count', 0)}")
        md.append(f"- **缺失的依赖**: {dep_health_result.get('missing_count', 0)}")
        md.append("")
        
        if dep_health_result.get('unused_dependencies'):
            md.append("### 未使用的依赖")
            for dep in dep_health_result['unused_dependencies'][:20]:
                md.append(f"- `{dep}`")
            md.append("")
        
        if dep_health_result.get('missing_dependencies'):
            md.append("### 缺失的依赖")
            for dep in dep_health_result['missing_dependencies'][:20]:
                md.append(f"- `{dep}`")
            md.append("")
        
        # 代码质量
        md.append("## 📈 代码质量分析")
        md.append("")
        cq = self.results['code_quality']
        md.append(f"- **分析文件数**: {cq.get('total_files_analyzed', 0)}")
        md.append(f"- **平均复杂度**: {cq.get('average_complexity', 0)}")
        md.append(f"- **大文件数** (>50KB): {cq.get('large_files_count', 0)}")
        md.append(f"- **复杂文件数** (score>30): {cq.get('complex_files_count', 0)}")
        md.append("")
        
        # 代码统计
        stats = cq.get('code_statistics', {})
        if stats:
            md.append("### 代码统计")
            md.append("")
            md.append(f"- **总行数**: {stats.get('total_lines', 0):,}")
            md.append(f"- **代码行数**: {stats.get('total_code_lines', 0):,}")
            md.append(f"- **注释行数**: {stats.get('total_comment_lines', 0):,}")
            md.append(f"- **空行数**: {stats.get('total_blank_lines', 0):,}")
            md.append(f"- **函数数**: {stats.get('total_functions', 0)}")
            md.append(f"- **类数**: {stats.get('total_classes', 0)}")
            md.append(f"- **导入数**: {stats.get('total_imports', 0)}")
            md.append(f"- **导出数**: {stats.get('total_exports', 0)}")
            md.append("")
            
            dist = stats.get('file_size_distribution', {})
            if dist:
                md.append("### 文件大小分布")
                md.append("")
                md.append(f"- **小文件** (<10KB): {dist.get('small', 0)}")
                md.append(f"- **中文件** (10-30KB): {dist.get('medium', 0)}")
                md.append(f"- **大文件** (≥30KB): {dist.get('large', 0)}")
                md.append("")
        
        if cq.get('large_files'):
            md.append("### 大文件列表")
            for file_info in cq['large_files']:
                md.append(f"- `{file_info['path']}` ({file_info['size_kb']} KB)")
            md.append("")
        
        if cq.get('complex_files'):
            md.append("### 复杂文件列表")
            for file_info in cq['complex_files']:
                md.append(f"- `{file_info['path']}` (复杂度: {file_info['score']})")
            md.append("")
        
        unused_imports = cq.get('unused_imports', {})
        if unused_imports.get('count', 0) > 0:
            md.append(f"### 未使用的导入 ({unused_imports['count']} 个)")
            for issue in unused_imports.get('issues', [])[:20]:
                md.append(f"- `{issue}`")
            md.append("")
        
        # 依赖关系
        md.append("## 📦 依赖关系")
        md.append("")
        deps = self.results['dependencies']
        md.append(f"- **生产依赖**: {deps.get('total_dependencies', 0)}")
        md.append(f"- **开发依赖**: {deps.get('total_dev_dependencies', 0)}")
        md.append(f"- **过时包数**: {deps.get('outdated_count', 0)}")
        md.append(f"- **安全漏洞**: {deps.get('vulnerabilities_count', 0)}")
        md.append("")
        
        if deps.get('vulnerabilities'):
            md.append("### 安全漏洞")
            for vuln in deps['vulnerabilities'][:10]:
                md.append(f"- **{vuln.get('id', 'Unknown')}** ({vuln.get('severity', 'unknown')})")
                if vuln.get('title'):
                    md.append(f"  - {vuln['title']}")
            md.append("")
        
        # 安全问题
        md.append("## 🔒 安全检查")
        md.append("")
        sec = self.results['security']
        md.append(f"- **潜在硬编码密钥**: {sec.get('hardcoded_secrets_count', 0)}")
        md.append("")
        
        if sec.get('issues'):
            md.append("### 潜在安全问题")
            for issue in sec['issues'][:20]:
                md.append(f"- `{issue['file']}:{issue['line']}` - {issue['type']}")
            md.append("")
        
        # 测试
        md.append("## 🧪 测试")
        md.append("")
        testing = cq.get('testing', {})
        md.append(f"- **测试文件数**: {testing.get('test_files_count', 0)}")
        md.append(f"- **测试状态**: {testing.get('test_status', 'unknown')}")
        if testing.get('test_files'):
            md.append("### 测试文件列表")
            for test_file in testing['test_files']:
                md.append(f"- `{test_file}`")
            md.append("")
        
        # 详细改进建议和步骤
        md.append("## 💡 改进建议与行动计划")
        md.append("")
        
        suggestions = []
        action_plans = []
        
        # P0: 严重问题
        if ts_result.get('error_count', 0) > 0:
            suggestions.append("🔴 **P0 - 紧急**: 修复所有 TypeScript 编译错误")
            action_plans.append({
                'priority': 'P0',
                'title': '修复 TypeScript 编译错误',
                'count': ts_result.get('error_count', 0),
                'steps': [
                    '运行 `npm run type-check` 查看所有错误',
                    '逐个修复类型错误',
                    '优先修复影响构建的错误',
                    '验证修复后运行 `npm run build` 确保构建成功'
                ],
                'estimated_time': f"{ts_result.get('error_count', 0) * 5} 分钟"
            })
        
        if eslint_result.get('error_count', 0) > 0:
            suggestions.append("🔴 **P0 - 紧急**: 修复 ESLint 错误")
            action_plans.append({
                'priority': 'P0',
                'title': '修复 ESLint 错误',
                'count': eslint_result.get('error_count', 0),
                'steps': [
                    '运行 `npm run lint` 查看所有错误',
                    '优先修复 React Hooks 规则错误（可能导致运行时问题）',
                    '修复 `@typescript-eslint/no-explicit-any` 错误（类型安全）',
                    '修复 `@typescript-eslint/no-unused-vars` 错误（清理代码）',
                    '使用 `npm run lint -- --fix` 自动修复可修复的问题',
                    '验证修复后运行 `npm run build`'
                ],
                'estimated_time': f"{eslint_result.get('error_count', 0) * 3} 分钟"
            })
        
        if sec.get('hardcoded_secrets_count', 0) > 0:
            suggestions.append("🔴 **P0 - 紧急**: 移除硬编码的敏感信息")
            action_plans.append({
                'priority': 'P0',
                'title': '移除硬编码敏感信息',
                'count': sec.get('hardcoded_secrets_count', 0),
                'steps': [
                    '检查报告中的安全问题列表',
                    '将所有硬编码的密钥、密码、API Key 移到环境变量',
                    '更新 `.env.local` 和 `.env.example`',
                    '确保 `.env.local` 在 `.gitignore` 中',
                    '验证代码中通过 `process.env` 读取环境变量'
                ],
                'estimated_time': f"{sec.get('hardcoded_secrets_count', 0) * 10} 分钟"
            })
        
        # P1: 重要问题
        if deps.get('vulnerabilities_count', 0) > 0:
            suggestions.append("🟠 **P1 - 重要**: 更新有安全漏洞的依赖包")
            action_plans.append({
                'priority': 'P1',
                'title': '更新安全漏洞依赖',
                'count': deps.get('vulnerabilities_count', 0),
                'steps': [
                    '运行 `npm audit` 查看详细漏洞信息',
                    '运行 `npm audit fix` 自动修复可修复的漏洞',
                    '对于需要手动更新的包，检查 breaking changes',
                    '更新后运行 `npm test` 确保测试通过',
                    '更新后运行 `npm run build` 确保构建成功'
                ],
                'estimated_time': '30-60 分钟'
            })
        
        if unused_imports.get('count', 0) > 0:
            suggestions.append("🟡 **P1 - 重要**: 清理未使用的导入")
            action_plans.append({
                'priority': 'P1',
                'title': '清理未使用的导入',
                'count': unused_imports.get('count', 0),
                'steps': [
                    '使用 IDE 的自动清理功能（如 VS Code 的 Organize Imports）',
                    '或手动检查报告中的未使用导入列表',
                    '逐个文件清理未使用的导入',
                    '运行 `npm run type-check` 验证清理后无错误'
                ],
                'estimated_time': f"{unused_imports.get('count', 0) * 1} 分钟"
            })
        
        # P2: 优化建议
        if cq.get('complex_files_count', 0) > 0:
            suggestions.append("🟢 **P2 - 优化**: 重构复杂度过高的文件")
            complex_files = cq.get('complex_files', [])
            action_plans.append({
                'priority': 'P2',
                'title': '重构复杂文件',
                'count': cq.get('complex_files_count', 0),
                'steps': [
                    '优先重构复杂度 > 50 的文件',
                    '将大函数拆分为多个小函数',
                    '提取重复逻辑为工具函数',
                    '使用设计模式简化复杂逻辑',
                    '添加单元测试确保重构后功能不变'
                ],
                'estimated_time': f"{cq.get('complex_files_count', 0) * 30} 分钟",
                'files': [f['path'] for f in complex_files[:10]]
            })
        
        dead_code_count = self.results.get('dead_code', {}).get('issue_count', 0)
        if dead_code_count > 0:
            suggestions.append("🟢 **P2 - 优化**: 清理死代码")
            action_plans.append({
                'priority': 'P2',
                'title': '清理死代码',
                'count': dead_code_count,
                'steps': [
                    '检查报告中的未使用导出列表',
                    '确认这些导出确实未被使用（检查是否被动态导入）',
                    '删除确认未使用的导出',
                    '注意：某些导出可能是为了未来使用，需谨慎删除'
                ],
                'estimated_time': f"{min(dead_code_count, 50) * 2} 分钟"
            })
        
        unused_deps = self.results.get('dependency_health', {}).get('unused_count', 0)
        if unused_deps > 0:
            suggestions.append("🟢 **P2 - 优化**: 移除未使用的依赖")
            action_plans.append({
                'priority': 'P2',
                'title': '移除未使用的依赖',
                'count': unused_deps,
                'steps': [
                    '检查报告中的未使用依赖列表',
                    '确认这些依赖确实未被使用',
                    '运行 `npm uninstall <package>` 移除',
                    '运行 `npm run build` 确保移除后无影响'
                ],
                'estimated_time': '10 分钟'
            })
        
        if testing.get('test_files_count', 0) < 10:
            suggestions.append("🟢 **P2 - 优化**: 增加测试覆盖率")
            action_plans.append({
                'priority': 'P2',
                'title': '增加测试覆盖率',
                'count': testing.get('test_files_count', 0),
                'steps': [
                    '为核心业务逻辑添加单元测试',
                    '为 API 路由添加集成测试',
                    '为工具函数添加测试',
                    '目标：测试覆盖率 > 70%',
                    '运行 `npm run test:coverage` 查看覆盖率报告'
                ],
                'estimated_time': '2-4 小时'
            })
        
        # 输出建议摘要
        if suggestions:
            md.append("### 优先级摘要")
            md.append("")
            for suggestion in suggestions:
                md.append(f"- {suggestion}")
            md.append("")
        
        # 输出详细行动计划
        if action_plans:
            md.append("### 详细行动计划")
            md.append("")
            
            # 按优先级分组
            p0_plans = [p for p in action_plans if p['priority'] == 'P0']
            p1_plans = [p for p in action_plans if p['priority'] == 'P1']
            p2_plans = [p for p in action_plans if p['priority'] == 'P2']
            
            for priority_group, plans in [('P0 - 紧急', p0_plans), ('P1 - 重要', p1_plans), ('P2 - 优化', p2_plans)]:
                if plans:
                    md.append(f"#### {priority_group}")
                    md.append("")
                    for plan in plans:
                        md.append(f"**{plan['title']}** ({plan['count']} 个问题)")
                        md.append("")
                        md.append(f"- **预计时间**: {plan.get('estimated_time', '未知')}")
                        md.append("- **执行步骤**:")
                        for i, step in enumerate(plan['steps'], 1):
                            md.append(f"  {i}. {step}")
                        if plan.get('files'):
                            md.append("- **相关文件**:")
                            for file_path in plan['files'][:5]:
                                md.append(f"  - `{file_path}`")
                        md.append("")
        
        if not suggestions:
            md.append("✅ 代码质量良好，无需特别改进")
        
        md.append("")
        md.append("---")
        md.append(f"*报告生成时间: {self.results['timestamp']}*")
        
        return "\n".join(md)


def main():
    project_root = Path(__file__).parent.parent
    checker = CodeHealthChecker(str(project_root))
    
    checker.run_all_checks()
    
    # 生成报告
    report = checker.generate_markdown_report()
    
    # 保存报告（确保只写入 Markdown，不包含任何 JSON）
    report_path = project_root / 'CODE_HEALTH_REPORT.md'
    # 确保报告是纯 Markdown 字符串（移除任何 JSON 污染）
    if isinstance(report, str):
        lines = report.split('\n')
        clean_lines = []
        skip_next_n_lines = 0
        
        for i, line in enumerate(lines):
            # 跳过 JSON 块
            if skip_next_n_lines > 0:
                skip_next_n_lines -= 1
                continue
            
            # 检测 JSON 块开始标记
            if ('"filePath"' in line or '"messages"' in line) and ('[' in line or '{' in line):
                # 跳过整个 JSON 对象/数组
                brace_count = line.count('{') + line.count('[') - line.count('}') - line.count(']')
                if brace_count > 0:
                    # 估算需要跳过的行数（保守估计）
                    skip_next_n_lines = min(50, brace_count * 10)
                    continue
            
            # 跳过明显的 JSON 行
            if line.strip().startswith('{') and '"filePath"' in line:
                continue
            if line.strip().startswith('[') and '"filePath"' in line:
                continue
            if '"usedDeprecatedRules"' in line:
                continue
            
            clean_lines.append(line)
        
        report = '\n'.join(clean_lines)
    
    report_path.write_text(report, encoding='utf-8')
    
    print(f"\n📄 报告已保存到: {report_path}")
    print("\n" + "="*60)
    # 只打印报告的前 100 行，避免输出过长
    report_lines = report.split('\n')
    print('\n'.join(report_lines[:100]))
    if len(report_lines) > 100:
        print(f"\n... (报告共 {len(report_lines)} 行，已截断)")
    print("="*60)


if __name__ == '__main__':
    main()

