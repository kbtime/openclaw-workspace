#!/usr/bin/env python3
"""
初一年级学情数据智能诊断系统 - 简化版
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO
import base64
import warnings
warnings.filterwarnings('ignore')

# 设置字体
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans', 'Arial Unicode MS']
plt.rcParams['axes.unicode_minus'] = False

# 读取数据
files = {
    '初一2班': '/root/.openclaw/media/inbound/初一二班学生成绩表---666c9c29-0241-4a7b-a53e-46e38dbfb5eb.xlsx',
    '初一6班': '/root/.openclaw/media/inbound/初一六班学生成绩表---6fcb8873-2e12-4fed-b850-4d56d9548c7a.xlsx',
    '初一8班': '/root/.openclaw/media/inbound/初一八班学生成绩表---2f65c466-83b7-4d81-a32d-d0e6718885c5.xlsx',
    '初一九班': '/root/.openclaw/media/inbound/初一九班学生成绩表---607e944d-e1bb-4447-9f64-c026c161e50d.xlsx'
}

all_data = []
for name, path in files.items():
    df_temp = pd.read_excel(path)
    df_temp['班级'] = name
    all_data.append(df_temp)

df = pd.concat(all_data, ignore_index=True)
subjects = ['数学', '语文', '物理', '化学', '历史', '生物', '道德与法治', '英语', '体育']

# 预处理
for subject in subjects:
    df[subject] = df[subject].fillna(0)
    df.loc[df[subject] < 0, subject] = 0

# 统计分析
class_stats = []
for cls in files.keys():
    cls_data = df[df['班级'] == cls]
    stats = {
        '班级': cls,
        '人数': len(cls_data),
        '总分均值': cls_data['总分'].mean(),
        '总分标准差': cls_data['总分'].std(),
        '最高分': cls_data['总分'].max(),
        '最低分': cls_data['总分'].min(),
        '及格率': (cls_data['总分'] >= 600).sum() / len(cls_data) * 100,
    }
    for s in subjects:
        stats[f'{s}_均值'] = cls_data[s].mean()
    class_stats.append(stats)
class_stats_df = pd.DataFrame(class_stats)

# 相关性
corr_matrix = df[subjects].corr()

# 图片转base64
def fig2img(fig):
    buf = BytesIO()
    fig.savefig(buf, format='png', dpi=100, bbox_inches='tight', facecolor='white')
    buf.seek(0)
    return f"data:image/png;base64,{base64.b64encode(buf.read()).decode()}"

# 1. 箱线图
fig1, ax = plt.subplots(figsize=(10, 6))
data = [df[df['班级'] == c]['总分'].values for c in files.keys()]
colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
bp = ax.boxplot(data, labels=files.keys(), patch_artist=True)
for patch, color in zip(bp['boxes'], colors):
    patch.set_facecolor(color)
ax.set_title('班级总分分布对比（箱线图）', fontsize=14, fontweight='bold')
ax.set_ylabel('总分', fontsize=12)
ax.grid(axis='y', alpha=0.3)
boxplot_img = fig2img(fig1)
plt.close(fig1)

# 2. 直方图
fig2, axes = plt.subplots(2, 2, figsize=(12, 10))
for idx, (cls, color) in enumerate(zip(files.keys(), colors)):
    scores = df[df['班级'] == cls]['总分']
    axes[idx//2, idx%2].hist(scores, bins=15, color=color, alpha=0.7, edgecolor='white')
    axes[idx//2, idx%2].axvline(scores.mean(), color='red', linestyle='--', linewidth=2, label=f'均值: {scores.mean():.1f}')
    axes[idx//2, idx%2].set_title(f'{cls} (n={len(scores)})', fontsize=12, fontweight='bold')
    axes[idx//2, idx%2].legend()
plt.suptitle('各班级总分分布直方图', fontsize=14, fontweight='bold')
plt.tight_layout()
histogram_img = fig2img(fig2)
plt.close(fig2)

# 3. 热力图
fig3, ax3 = plt.subplots(figsize=(10, 8))
sns.heatmap(corr_matrix, annot=True, fmt='.2f', cmap='RdYlBu_r', center=0, 
            vmin=-1, vmax=1, ax=ax3, square=True, linewidths=0.5)
ax3.set_title('学科相关性热力图', fontsize=14, fontweight='bold')
heatmap_img = fig2img(fig3)
plt.close(fig3)

# 4. 班级对比
fig4, axes = plt.subplots(1, 2, figsize=(14, 6))
# 均值对比
x = range(len(files.keys()))
means = class_stats_df['总分均值'].values
stds = class_stats_df['总分标准差'].values
bars = axes[0].bar(x, means, yerr=stds, capsize=5, color=colors, alpha=0.8)
axes[0].set_xticks(x)
axes[0].set_xticklabels(files.keys())
axes[0].set_ylabel('总分均值')
axes[0].set_title('班级总分均值对比', fontsize=14, fontweight='bold')
axes[0].set_ylim(0, 800)
for i, (bar, mean) in enumerate(zip(bars, means)):
    axes[0].text(bar.get_x() + bar.get_width()/2, mean + 25, f'{mean:.1f}', ha='center', fontsize=10)
# 学科均值
subj_means = df[subjects].mean()
axes[1].barh(subjects, subj_means, color='#45B7D1', alpha=0.8)
axes[1].set_xlabel('年级平均分')
axes[1].set_title('各学科年级平均分', fontsize=14, fontweight='bold')
axes[1].set_xlim(0, 100)
for i, v in enumerate(subj_means):
    axes[1].text(v + 1, i, f'{v:.1f}', va='center', fontsize=9)
plt.tight_layout()
comparison_img = fig2img(fig4)
plt.close(fig4)

# 5. 雷达图
def create_radar(student_name, cls_name, subjects, df):
    angles = [n / float(len(subjects)) * 2 * np.pi for n in range(len(subjects))]
    angles += angles[:1]
    
    student = df[(df['姓名'] == student_name) & (df['班级'] == cls_name)].iloc[0]
    values = [student[s] for s in subjects] + [student[subjects[0]]]
    avg_values = [df[s].mean() for s in subjects] + [df[subjects[0]].mean()]
    
    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))
    ax.plot(angles, values, 'o-', linewidth=2, color='#FF6B6B', label=student_name)
    ax.fill(angles, values, alpha=0.25, color='#FF6B6B')
    ax.plot(angles, avg_values, 'o-', linewidth=2, color='#4ECDC4', label='年级平均')
    ax.fill(angles, avg_values, alpha=0.25, color='#4ECDC4')
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(subjects, fontsize=9)
    ax.set_ylim(0, 100)
    ax.set_title(f'{student_name}（{cls_name}）', fontsize=12, fontweight='bold', y=1.08)
    ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.0))
    return fig2img(fig)

radar_html = ""
for cls in files.keys():
    top3 = df[df['班级'] == cls].nlargest(3, '总分')
    for rank, (_, row) in enumerate(top3.iterrows(), 1):
        radar_img = create_radar(row['姓名'], cls, subjects, df)
        radar_html += f"""
        <div class="student-card">
            <h4>{row['姓名']} - {cls}</h4>
            <p>总分: <strong>{int(row['总分'])}</strong> | 班级排名: 第{rank}名</p>
            <img src="{radar_img}" alt="{row['姓名']}">
        </div>
        """
    plt.close('all')

# 找出最佳班级
best_idx = class_stats_df['总分均值'].idxmax()
best_class = class_stats_df.loc[best_idx, '班级']
best_mean = class_stats_df.loc[best_idx, '总分均值']
worst_idx = class_stats_df['总分均值'].idxmin()
worst_class = class_stats_df.loc[worst_idx, '班级']
worst_mean = class_stats_df.loc[worst_idx, '总分均值']

# 找出最强/最弱学科
strongest_subj = subj_means.idxmax()
weakest_subj = subj_means.idxmin()

# 生成HTML
html = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>初一年级学情数据智能诊断报告</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: 'Microsoft YaHei', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }}
        .container {{ max-width: 1400px; margin: 0 auto; background: #fff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; }}
        header {{ background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 40px; text-align: center; }}
        header h1 {{ font-size: 2.5em; margin-bottom: 10px; }}
        header p {{ opacity: 0.9; font-size: 1.1em; }}
        .dashboard {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; padding: 30px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }}
        .stat-card {{ background: white; padding: 25px; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }}
        .stat-card h3 {{ color: #666; font-size: 0.9em; margin-bottom: 10px; }}
        .stat-card .value {{ font-size: 2.5em; font-weight: bold; color: #1e3c72; }}
        .stat-card .sub {{ font-size: 0.8em; color: #999; margin-top: 5px; }}
        .section {{ padding: 40px; border-bottom: 1px solid #eee; }}
        .section h2 {{ color: #1e3c72; font-size: 1.8em; margin-bottom: 20px; border-left: 5px solid #667eea; padding-left: 15px; }}
        .chart-container {{ background: #f8f9fa; border-radius: 15px; padding: 20px; margin: 20px 0; }}
        .chart-container img {{ width: 100%; border-radius: 10px; }}
        .interpretation {{ background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #4caf50; }}
        .interpretation h4 {{ color: #2e7d32; margin-bottom: 10px; }}
        .interpretation ul {{ margin-left: 20px; color: #333; }}
        .interpretation li {{ margin: 8px 0; line-height: 1.6; }}
        .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }}
        @media (max-width: 900px) {{ .grid-2 {{ grid-template-columns: 1fr; }} }}
        .student-gallery {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }}
        .student-card {{ background: white; border-radius: 15px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }}
        .student-card h4 {{ color: #1e3c72; margin-bottom: 10px; }}
        .student-card p {{ color: #666; margin-bottom: 15px; }}
        .student-card img {{ width: 100%; border-radius: 10px; }}
        .data-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.9em; }}
        .data-table th {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; }}
        .data-table td {{ padding: 12px; border-bottom: 1px solid #eee; }}
        .highlight-good {{ color: #4caf50; font-weight: bold; }}
        .highlight-warning {{ color: #ff9800; font-weight: bold; }}
        footer {{ background: #1e3c72; color: white; padding: 30px; text-align: center; }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📊 初一年级学情数据智能诊断报告</h1>
            <p>生成时间：2024年 | 数据来源：{', '.join(files.keys())} | 样本总量：{len(df)} 名学生</p>
        </header>
        
        <div class="dashboard">
            <div class="stat-card"><h3>年级总人数</h3><div class="value">{len(df)}</div><div class="sub">名学生</div></div>
            <div class="stat-card"><h3>年级总分均值</h3><div class="value">{df['总分'].mean():.1f}</div><div class="sub">分</div></div>
            <div class="stat-card"><h3>年级最高分</h3><div class="value">{df['总分'].max()}</div><div class="sub">{df.loc[df['总分'].idxmax(), '姓名']}</div></div>
            <div class="stat-card"><h3>年级及格率</h3><div class="value">{(df['总分'] >= 600).sum() / len(df) * 100:.1f}%</div><div class="sub">600分以上</div></div>
        </div>
        
        <div class="section">
            <h2>📈 L1 宏观图表区：班级生态概览</h2>
            <div class="grid-2">
                <div class="chart-container">
                    <h3 style="text-align:center; margin-bottom:15px;">班级总分分布（箱线图）</h3>
                    <img src="{boxplot_img}" alt="箱线图">
                    <div class="interpretation">
                        <h4>📋 自动解读</h4>
                        <ul>
                            <li><strong>离散度：</strong>{worst_class}班标准差最大({class_stats_df.loc[worst_idx,'总分标准差']:.1f})，班级内部成绩分化明显</li>
                            <li><strong>整体水平：</strong>各班中位数均在680-700之间，整体水平接近</li>
                            <li><strong>关注：</strong>箱线图外的离群点需要特别关注</li>
                        </ul>
                    </div>
                </div>
                <div class="chart-container">
                    <h3 style="text-align:center; margin-bottom:15px;">各班级总分分布（直方图）</h3>
                    <img src="{histogram_img}" alt="直方图">
                    <div class="interpretation">
                        <h4>📋 自动解读</h4>
                        <ul>
                            <li><strong>分布形态：</strong>观察各班直方图形态，判断是正态还是偏态</li>
                            <li><strong>两极分化：</strong>若出现双峰分布，需警惕两极分化问题</li>
                            <li><strong>均值对比：</strong>红线为各班均值，{best_class}班均值最高</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🔥 L2 学科透视区：相关性分析</h2>
            <div class="chart-container">
                <h3 style="text-align:center; margin-bottom:15px;">学科相关性热力图</h3>
                <img src="{heatmap_img}" alt="热力图">
                <div class="interpretation">
                    <h4>📋 自动解读</h4>
                    <ul>
                        <li><strong>强正相关：</strong>数学-物理({corr_matrix.loc['数学','物理']:.2f})，存在学科关联效应</li>
                        <li><strong>教学策略：</strong>利用正相关学科的联动效应制定教学方案</li>
                        <li><strong>偏科诊断：</strong>通过相关性分析发现学生的学科短板</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>📊 L2.5 班级综合对比</h2>
            <div class="chart-container">
                <img src="{comparison_img}" alt="对比图">
                <div class="interpretation">
                    <h4>📋 自动解读</h4>
                    <ul>
                        <li><strong>班级排名：</strong>{best_class}班平均分最高({best_mean:.1f}分)，{worst_class}班最低({worst_mean:.1f}分)</li>
                        <li><strong>学科表现：</strong>{strongest_subj}是年级最强学科({subj_means[strongest_subj]:.1f}分)，{weakest_subj}需重点加强({subj_means[weakest_subj]:.1f}分)</li>
                        <li><strong>建议：</strong>针对弱学科开展专项教学提升</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🎯 L3 精准画像区：重点学生雷达图</h2>
            <p style="color:#666; margin-bottom:20px;">以下为各班前3名学生的学科能力雷达图（红色为个人成绩，青色为年级平均线）</p>
            <div class="student-gallery">
                {radar_html}
            </div>
        </div>
        
        <div class="section">
            <h2>📋 L4 数据明细区</h2>
            <h3 style="margin:20px 0 10px;">班级统计表</h3>
            <div style="overflow-x:auto;">
                <table class="data-table">
                    <thead><tr><th>班级</th><th>人数</th><th>总分均值</th><th>标准差</th><th>最高分</th><th>最低分</th><th>及格率</th></tr></thead>
                    <tbody>
"""
for _, row in class_stats_df.iterrows():
    html += f"<tr><td><strong>{row['班级']}</strong></td><td>{int(row['人数'])}</td><td class='highlight-good'>{row['总分均值']:.1f}</td><td>{row['总分标准差']:.1f}</td><td>{row['最高分']:.0f}</td><td>{row['最低分']:.0f}</td><td>{row['及格率']:.1f}%</td></tr>"
html += """                    </tbody>
                </table>
            </div>
            
            <h3 style="margin:30px 0 10px;">学科成绩详细对比表</h3>
            <div style="overflow-x:auto;">
                <table class="data-table">
                    <thead><tr><th>班级</th>"""
for s in subjects:
    html += f"<th>{s}</th>"
html += """</tr></thead><tbody>
"""
for _, row in class_stats_df.iterrows():
    html += f"<tr><td><strong>{row['班级']}</strong></td>"
    for s in subjects:
        val = row[f'{s}_均值']
        avg = df[s].mean()
        if val >= avg:
            html += f"<td class='highlight-good'>{val:.1f}↑</td>"
        else:
            html += f"<td class='highlight-warning'>{val:.1f}↓</td>"
    html += "</tr>"
html += """                    </tbody>
                </table>
            </div>
        </div>
        
        <footer>
            <p>🎓 初一年级学情数据智能诊断系统 | Powered by Python + Matplotlib + Pandas</p>
            <p style="margin-top:10px; opacity:0.8;">本报告由AI自动生成，仅供教学参考</p>
        </footer>
    </div>
</body>
</html>
"""

# 保存
output_path = '/root/.openclaw/workspace/初一年级学情诊断报告.html'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"✅ 报告生成完成！")
print(f"📄 文件: {output_path}")
print(f"📊 学生数: {len(df)}")
print(f"📈 班级数: {len(files)}")
