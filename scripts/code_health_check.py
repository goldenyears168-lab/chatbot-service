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
            'code_quality': {},
            'dependencies': {},
            'file_analysis': {},
            'security': {},
            'performance': {},
            'summary': {}
        }
        
    def run_command(self, cmd: List[str], cwd: str = None) -> Tuple[int, str, str]:
        """运行命令并返回结果"""
        try:
            result = subprocess.run(
                cmd,
                cwd=cwd or self.project_root,
                capture_output=True,
                text=True,
                timeout=120
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return -1, "", "Command timeout"
        except Exception as e:
            return -1, "", str(e)
    
    def check_typescript(self):
        """检查 TypeScript 编译错误"""
        print("🔍 检查 TypeScript 编译错误...")
        returncode, stdout, stderr = self.run_command(['npx', 'tsc', '--noEmit', '--pretty', 'false'])
        
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
        returncode, stdout, stderr = self.run_command(['npm', 'run', 'lint', '--', '--format', 'json'])
        
        issues = []
        if returncode != 0:
            try:
                # ESLint JSON 格式输出
                output = stdout or stderr
                if output:
                    # 尝试解析 JSON
                    try:
                        eslint_data = json.loads(output)
                        for file_path, file_issues in eslint_data.items():
                            if isinstance(file_issues, list):
                                issues.extend([f"{file_path}: {issue.get('message', '')}" for issue in file_issues])
                    except:
                        # 如果不是 JSON，解析文本输出
                        for line in output.split('\n'):
                            if line.strip() and ('error' in line.lower() or 'warning' in line.lower()):
                                issues.append(line.strip())
            except:
                pass
        
        self.results['eslint'] = {
            'status': 'pass' if returncode == 0 else 'fail',
            'issue_count': len(issues),
            'issues': issues[:50]
        }
        
        return returncode == 0
    
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
                    if 'node_modules' in str(file_path) or '.next' in str(file_path):
                        continue
                
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
        
        # 统计
        total_files = len(files_analyzed)
        avg_complexity = sum(f.get('complexity_score', 0) for f in files_analyzed) / total_files if total_files > 0 else 0
        large_files = [f for f in files_analyzed if f.get('file_size_kb', 0) > 50]
        complex_files = [f for f in files_analyzed if f.get('complexity_score', 0) > 30]
        
        self.results['code_quality'] = {
            'total_files_analyzed': total_files,
            'average_complexity': round(avg_complexity, 2),
            'large_files_count': len(large_files),
            'complex_files_count': len(complex_files),
            'large_files': [{'path': f['path'], 'size_kb': f['file_size_kb']} for f in large_files[:10]],
            'complex_files': [{'path': f['path'], 'score': f['complexity_score']} for f in complex_files[:10]],
            'issues': issues[:50]
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
            returncode, stdout, _ = self.run_command(['npm', 'outdated', '--json'])
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
            returncode, stdout, _ = self.run_command(['npm', 'audit', '--json'])
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
                except:
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
        """检查未使用的导入（通过 TypeScript 检查）"""
        print("🔍 检查未使用的导入...")
        
        unused_issues = []
        returncode, stdout, stderr = self.run_command(['npx', 'tsc', '--noEmit', '--pretty', 'false'])
        
        if returncode != 0:
            output = stderr + stdout
            for line in output.split('\n'):
                if 'is declared but its value is never read' in line or 'is declared but never used' in line:
                    unused_issues.append(line.strip())
        
        self.results['code_quality']['unused_imports'] = {
            'count': len(unused_issues),
            'issues': unused_issues[:30]
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
        """检查测试覆盖率"""
        print("🔍 检查测试覆盖率...")
        
        test_files = list((self.project_root / 'lib' / '__tests__').glob('*.test.ts'))
        test_count = len(test_files)
        
        # 尝试运行测试
        test_status = 'unknown'
        test_output = ''
        try:
            returncode, stdout, stderr = self.run_command(['npm', 'test', '--', '--passWithNoTests'])
            test_status = 'pass' if returncode == 0 else 'fail'
            test_output = stdout + stderr
        except:
            pass
        
        self.results['code_quality']['testing'] = {
            'test_files_count': test_count,
            'test_status': test_status,
            'test_files': [str(f.name) for f in test_files]
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
        if self.results['eslint'].get('issue_count', 0) > 0:
            summary['issues_found'] += self.results['eslint']['issue_count']
            summary['warnings'].append(f"ESLint 问题: {self.results['eslint']['issue_count']} 个")
        
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
        """运行所有检查"""
        print("🚀 开始代码健康度检查...\n")
        
        self.check_typescript()
        self.check_eslint()
        self.analyze_code_quality()
        self.check_unused_imports()
        self.check_dependencies()
        self.check_security()
        self.check_test_coverage()
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
        md.append(f"- **问题数**: {eslint_result.get('issue_count', 0)}")
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
        
        # 建议
        md.append("## 💡 改进建议")
        md.append("")
        
        suggestions = []
        if ts_result.get('error_count', 0) > 0:
            suggestions.append("修复所有 TypeScript 编译错误")
        if eslint_result.get('issue_count', 0) > 0:
            suggestions.append("修复 ESLint 代码风格问题")
        if deps.get('vulnerabilities_count', 0) > 0:
            suggestions.append("更新有安全漏洞的依赖包")
        if unused_imports.get('count', 0) > 0:
            suggestions.append("清理未使用的导入")
        if cq.get('complex_files_count', 0) > 0:
            suggestions.append("重构复杂度过高的文件，提高可维护性")
        if sec.get('hardcoded_secrets_count', 0) > 0:
            suggestions.append("移除硬编码的敏感信息，使用环境变量")
        if testing.get('test_files_count', 0) < 5:
            suggestions.append("增加测试覆盖率，提高代码质量")
        
        if suggestions:
            for i, suggestion in enumerate(suggestions, 1):
                md.append(f"{i}. {suggestion}")
        else:
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
    
    # 保存报告
    report_path = project_root / 'CODE_HEALTH_REPORT.md'
    report_path.write_text(report, encoding='utf-8')
    
    print(f"\n📄 报告已保存到: {report_path}")
    print("\n" + "="*60)
    print(report)
    print("="*60)


if __name__ == '__main__':
    main()

