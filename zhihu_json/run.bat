@echo 开始运行...

@echo 清除旧文件...

rd /s/q data

rd /s/q imgs

md data

md imgs

@echo 开始爬取...

node index.js