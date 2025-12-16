#!/bin/bash
# 复制知识库文件到 public 目录，以便在 Edge Runtime 中通过 HTTP 访问

echo "复制知识库文件到 public 目录..."

# 为每个公司复制知识库
for company_dir in projects/*/; do
  if [ -d "$company_dir/knowledge" ]; then
    company=$(basename "$company_dir")
    echo "复制 $company 的知识库..."
    mkdir -p "public/projects/$company/knowledge"
    cp -r "$company_dir/knowledge"/* "public/projects/$company/knowledge/" 2>/dev/null
    
    # 生成文件清单（用于 Edge Runtime）
    json_files=()
    for file in "public/projects/$company/knowledge"/*.json; do
      if [ -f "$file" ]; then
        filename=$(basename "$file")
        json_files+=("\"$filename\"")
      fi
    done
    if [ ${#json_files[@]} -gt 0 ]; then
      echo "[$(IFS=,; echo "${json_files[*]}")]" > "public/projects/$company/knowledge/_manifest.json"
    fi
    
    echo "✅ $company 完成"
  fi
done

echo "✅ 所有知识库文件已复制到 public 目录"

