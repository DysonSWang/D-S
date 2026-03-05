# 三诺设备蓝牙对接 SDK (非官方)

**声明**: 这是基于蓝牙标准 HRP/BLP 协议的非官方实现，仅供学习研究使用。

---

## 📦 项目结构

```
sinocare_ble_sdk/
├── README.md                 # 本文件
├── requirements.txt          # Python 依赖
├── ble_scanner.py           # 蓝牙扫描器
├── device_parser.py         # 数据解析器
├── test_device.py           # 设备测试脚本
└── examples/
    ├── ios/                 # iOS 示例
    ├── android/             # Android 示例
    └── react_native/        # React Native 示例
```

---

## 🔧 安装依赖

```bash
pip install bleak asyncio
```

---

## 🚀 快速开始

### 1. 扫描设备

```bash
python ble_scanner.py
```

输出示例:
```
扫描三诺设备...
找到设备：Sinocare_BA2000_7113 (MAC: 00:1A:7D:DA:71:13)
找到设备：Sinocare_BA803_8254 (MAC: 00:1A:7D:DA:82:54)
```

### 2. 连接并读取数据

```bash
python test_device.py --mac 00:1A:7D:DA:71:13
```

---

## 📱 设备支持

| 设备型号 | 类型 | 蓝牙 Profile | 状态 |
|---------|------|-------------|------|
| BA-2000 (臻准 2000) | 血糖仪 | HRP | ✅ 支持 |
| BA-803 | 血压计 | BLP | ✅ 支持 |

---

## 🔍 技术细节

### 蓝牙服务 UUID

**血糖仪 (HRP)**:
- 服务：`00001809-0000-1000-8000-00805f9b34fb`
- 特征：`00002A1C-0000-1000-8000-00805f9b34fb`

**血压计 (BLP)**:
- 服务：`00001810-0000-1000-8000-00805f9b34fb`
- 特征：`00002A35-0000-1000-8000-00805f9b34fb`

---

## ⚠️ 注意事项

1. **非官方 SDK** - 基于标准蓝牙协议逆向
2. **兼容性** - 不同固件版本可能有差异
3. **医疗认证** - 商业用途需要 NMPA 认证
4. **法律责任** - 请遵守相关法律法规

---

## 📞 官方支持

如需官方 SDK，请联系三诺生物：
- 官网：https://www.sinocare.com
- 客服：400-700-1991
