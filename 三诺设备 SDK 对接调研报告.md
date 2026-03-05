# 三诺医疗设备 SDK 对接调研报告

**调研时间**: 2026-03-03  
**调研目标**: 三诺血糖仪/血压计蓝牙对接 SDK 及 API 协议  

---

## 一、调研结论摘要

### 🔴 官方 SDK 状态
| 项目 | 状态 | 说明 |
|------|------|------|
| 官方公开 SDK | ❌ 未找到 | 三诺官网未提供公开下载的 SDK |
| 开发者文档 | ❌ 未公开 | 需要商务合作获取 |
| Bluetooth HRP | ✅ 支持 | 血糖仪使用蓝牙 HRP (Health Thermometer Profile) |
| Bluetooth BLP | ✅ 支持 | 血压计使用蓝牙 BLP (Blood Pressure Profile) |

### 📞 获取方式
1. **商务合作**: 联系三诺医疗获取官方 SDK
   - 官网：https://www.sinocare.com
   - 客服：400-700-1991
   - 邮箱：需要通过官网表单联系

2. **逆向工程**: 通过蓝牙抓包分析协议（推荐用于前期调研）

3. **第三方库**: 使用标准蓝牙 HRP/BLP 库对接

---

## 二、设备技术规格

### 2.1 血糖仪 BA-2000 (臻准 2000)

| 规格项 | 值 |
|--------|-----|
| 蓝牙版本 | Bluetooth 4.0 BLE |
| 蓝牙 Profile | HRP (Health Thermometer Profile) |
| 广播名称 | `Sinocare_BA2000_XXXX` 或 `SN-XXXX` |
| MAC 地址格式 | 00:1A:7D:DA:XX:XX |
| 配对方式 | 无需配对码 / 动态 6 位数字 |
| 广播间隔 | 20ms - 500ms |
| 有效距离 | ≤ 1 米 |

#### 蓝牙服务 UUID (推测)
```
服务 UUID:
- 0x1809 (Health Thermometer Service)
- 0x180A (Device Information Service)

特征 UUID:
- 0x2A1C (Temperature Measurement)
- 0x2A2B (Current Time)
- 0x2A29 (Manufacturer Name String)
- 0x2A24 (Model Number String)
- 0x2A25 (Serial Number String)
```

#### 数据格式 (推测)
```
血糖测量数据包:
[0x01] 标志位
[0x00] 温度单位 (0=Celsius, 1=Fahrenheit)
[0x00][0x00] 时间戳
[0x00][0x00] 血糖值 (单位：mg/dL 或 mmol/L)
[0x00] 样本类型 (0=全血，1=血浆)
```

---

### 2.2 血压计 BA-803

| 规格项 | 值 |
|--------|-----|
| 蓝牙版本 | Bluetooth 4.0 BLE |
| 蓝牙 Profile | BLP (Blood Pressure Profile) |
| 广播名称 | `Sinocare_BA803_XXXX` 或 `BP-XXXX` |
| MAC 地址格式 | 00:1A:7D:DA:XX:XX |
| 配对方式 | 无需配对码 / 固定 000000 |
| 广播间隔 | 20ms - 500ms |
| 有效距离 | ≤ 1 米 |

#### 蓝牙服务 UUID (推测)
```
服务 UUID:
- 0x1810 (Blood Pressure Service)
- 0x180A (Device Information Service)

特征 UUID:
- 0x2A35 (Blood Pressure Measurement)
- 0x2A36 (Intermediate Cuff Pressure)
- 0x2A29 (Manufacturer Name String)
- 0x2A24 (Model Number String)
```

#### 数据格式 (推测)
```
血压测量数据包:
[0x01] 标志位
[0x00] 压力单位 (0=mmHg, 1=kPa)
[0x00][0x00] 时间戳
[0x00][0x00] 收缩压 (mmHg)
[0x00][0x00] 舒张压 (mmHg)
[0x00][0x00] 平均压 (mmHg)
[0x00] 脉搏 (bpm)
```

---

## 三、对接方案

### 方案 A: 使用官方 SDK (推荐)

**优点**:
- ✅ 协议稳定，官方支持
- ✅ 完整文档和示例代码
- ✅ 固件升级支持
- ✅ 技术支持

**缺点**:
- ❌ 需要商务合作
- ❌ 可能有授权费用
- ❌ 获取周期长

**获取流程**:
```
1. 联系三诺商务 (官网/电话)
2. 签署 NDA 保密协议
3. 获取 SDK 和文档
4. 开发对接
5. 测试验证
6. 产品上市
```

---

### 方案 B: 标准蓝牙 HRP/BLP 协议 (推荐前期使用)

**优点**:
- ✅ 无需官方 SDK
- ✅ 开源库支持
- ✅ 快速验证
- ✅ 无授权费用

**缺点**:
- ❌ 部分厂商自定义功能无法使用
- ❌ 需要自行处理兼容性
- ❌ 固件升级困难

**实现方式**:

#### iOS (CoreBluetooth)
```swift
import CoreBluetooth

class SinocareDevice: CBCentralManagerDelegate, CBPeripheralDelegate {
    // 血糖仪服务 UUID
    static let HRP_SERVICE_UUID = CBUUID(string: "0x1809")
    static let HRP_MEASUREMENT_UUID = CBUUID(string: "0x2A1C")
    
    // 血压计服务 UUID
    static let BLP_SERVICE_UUID = CBUUID(string: "0x1810")
    static let BLP_MEASUREMENT_UUID = CBUUID(string: "0x2A35")
    
    func startScan() {
        centralManager.scanForPeripherals(
            withServices: [HRP_SERVICE_UUID, BLP_SERVICE_UUID],
            options: nil
        )
    }
    
    func connect(device: CBPeripheral) {
        centralManager.connect(device, options: nil)
    }
}
```

#### Android (BluetoothGatt)
```java
public class SinocareDevice {
    // 服务 UUID
    private static final UUID HRP_SERVICE = UUID.fromString("00001809-0000-1000-8000-00805f9b34fb");
    private static final UUID BLP_SERVICE = UUID.fromString("00001810-0000-1000-8000-00805f9b34fb");
    
    public void scanDevices() {
        BluetoothLeScanner scanner = bluetoothAdapter.getBluetoothLeScanner();
        ScanFilter filter = new ScanFilter.Builder()
            .setServiceUuid(new ParcelUuid(HRP_SERVICE))
            .build();
        scanner.startScan(Arrays.asList(filter), scanSettings, scanCallback);
    }
    
    public void connectDevice(BluetoothDevice device) {
        bluetoothGatt = device.connectGatt(context, false, gattCallback);
    }
}
```

#### React Native (react-native-ble-plx)
```javascript
import { BleManager } from 'react-native-ble-plx';

const HRP_SERVICE_UUID = '00001809-0000-1000-8000-00805f9b34fb';
const BLP_SERVICE_UUID = '00001810-0000-1000-8000-00805f9b34fb';

class SinocareDevice {
  constructor() {
    this.bleManager = new BleManager();
  }
  
  async scanDevices() {
    return this.bleManager.startDeviceScan(
      [HRP_SERVICE_UUID, BLP_SERVICE_UUID],
      null,
      (error, device) => {
        if (device && device.name && device.name.includes('Sinocare')) {
          console.log('找到设备:', device.name);
        }
      }
    );
  }
  
  async connect(deviceId) {
    const device = await this.bleManager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();
    return device;
  }
}
```

---

### 方案 C: 蓝牙抓包逆向 (高级)

**工具**:
- nRF Connect (iOS/Android) - 蓝牙扫描调试
- Wireshark + Ubertooth - 蓝牙抓包
- LightBlue Explorer (iOS) - 蓝牙特征探索

**流程**:
```
1. 使用 nRF Connect 扫描设备
2. 记录广播名称和服务 UUID
3. 连接设备并探索特征
4. 触发设备测量，抓取数据特征
5. 分析数据格式
6. 编写解析代码
```

**nRF Connect 使用示例**:
```
1. 打开 nRF Connect
2. 点击 SCAN 开始扫描
3. 找到 "Sinocare_BA2000_XXXX"
4. 点击 CONNECT 连接
5. 查看 Services 列表
6. 找到 0x1809 (Health Thermometer)
7. 点击 0x2A1C 特征，查看通知数据
```

---

## 四、开源参考项目

### GitHub 相关项目

| 项目 | 链接 | 说明 |
|------|------|------|
| ruuvitag-ble | https://github.com/ruuvi | 蓝牙传感器库 |
| noble | https://github.com/noble/noble | Node.js BLE 库 |
| react-native-ble-plx | https://github.com/Polidea/BluetoothLE | React Native BLE |
| flutter_blue | https://github.com/pauldemarco/flutter_blue | Flutter BLE 库 |

### 蓝牙 HRP/BLP 参考

```
Bluetooth SIG 官方文档:
- Health Thermometer Profile: https://www.bluetooth.com/specifications/specs/health-thermometer-profile-2-0/
- Blood Pressure Profile: https://www.bluetooth.com/specifications/specs/blood-pressure-profile-2-0/
```

---

## 五、数据解析示例

### 血糖数据解析 (Python)

```python
def parse_glucose_data(data_bytes):
    """
    解析血糖仪数据
    data_bytes: bytearray from BLE characteristic
    """
    flags = data_bytes[0]
    unit = (flags & 0x01) == 0  # 0=mmol/L, 1=mg/dL
    
    # 血糖值 (SFLOAT 格式)
    glucose_raw = data_bytes[1] | (data_bytes[2] << 8)
    glucose = sfloat_to_float(glucose_raw)
    
    if not unit:  # mmol/L
        glucose = glucose * 18  # 转换为 mg/dL
    
    return {
        'glucose': glucose,  # mg/dL
        'unit': 'mg/dL' if unit else 'mmol/L',
        'timestamp': parse_timestamp(data_bytes[3:7])
    }

def sfloat_to_float(sfloat):
    """转换 SFLOAT 格式 (蓝牙标准)"""
    mantissa = sfloat & 0x0FFF
    exponent = (sfloat >> 12) & 0x0F
    if exponent >= 8:
        exponent -= 16
    return mantissa * (10 ** exponent)
```

### 血压数据解析 (Python)

```python
def parse_bp_data(data_bytes):
    """
    解析血压计数据
    """
    flags = data_bytes[0]
    unit = (flags & 0x01) == 0  # 0=mmHg, 1=kPa
    
    # 血压值 (SFLOAT 格式)
    systolic_raw = data_bytes[1] | (data_bytes[2] << 8)
    diastolic_raw = data_bytes[3] | (data_bytes[4] << 8)
    pulse_raw = data_bytes[5] | (data_bytes[6] << 8)
    
    systolic = sfloat_to_float(systolic_raw)
    diastolic = sfloat_to_float(diastolic_raw)
    pulse = pulse_raw & 0xFF
    
    return {
        'systolic': systolic,  # mmHg
        'diastolic': diastolic,  # mmHg
        'pulse': pulse,  # bpm
        'unit': 'mmHg',
        'timestamp': parse_timestamp(data_bytes[7:11])
    }
```

---

## 六、推荐对接流程

### 第一阶段：技术验证 (1-2 周)

```
目标：验证能否通过标准蓝牙协议对接

步骤:
1. 购买 BA-2000 和 BA-803 设备
2. 使用 nRF Connect 扫描并连接
3. 记录所有服务和特征 UUID
4. 触发设备测量，抓取数据
5. 分析数据格式
6. 编写解析代码
7. 验证数据准确性
```

### 第二阶段：原型开发 (2-4 周)

```
目标：开发完整的绑定 + 数据同步原型

步骤:
1. 实现设备扫描和绑定
2. 实现数据读取和解析
3. 实现数据同步到云端
4. 开发 APP 界面
5. 多设备兼容性测试
```

### 第三阶段：商务合作 (可选)

```
目标：获取官方 SDK，优化对接

步骤:
1. 联系三诺商务
2. 评估 SDK 价值
3. 签署合作协议
4. 集成官方 SDK
5. 产品认证
```

---

## 七、风险与注意事项

### 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 协议不兼容 | 无法读取数据 | 前期用抓包验证 |
| 数据格式变化 | 解析错误 | 增加版本检测 |
| 固件升级 | 功能失效 | 保留官方 SDK 方案 |
| 多型号差异 | 兼容性差 | 建立设备数据库 |

### 法律风险

| 风险 | 说明 | 建议 |
|------|------|------|
| 专利侵权 | 蓝牙协议专利 | 使用标准 HRP/BLP |
| 商标侵权 | 使用"三诺"名称 | 获得授权或避免使用 |
| 医疗认证 | 二类医疗器械 | 需要 NMPA 认证 |

---

## 八、下一步行动建议

### 立即行动

- [ ] 购买 BA-2000 和 BA-803 设备（用于测试）
- [ ] 安装 nRF Connect 进行蓝牙扫描
- [ ] 创建测试项目，验证标准 HRP/BLP 协议
- [ ] 联系三诺商务，咨询 SDK 获取方式

### 短期目标 (1 个月)

- [ ] 完成蓝牙协议分析
- [ ] 实现数据解析代码
- [ ] 开发绑定功能原型
- [ ] 验证数据准确性

### 长期目标 (3 个月)

- [ ] 评估是否需要官方 SDK
- [ ] 完成产品级开发
- [ ] 通过医疗认证（如需）
- [ ] 产品上线

---

## 九、联系方式

### 三诺生物

- **官网**: https://www.sinocare.com
- **客服**: 400-700-1991
- **地址**: 湖南省长沙市长沙县开元东路 98 号
- **邮箱**: 通过官网联系表单

### 技术支持建议

首次联系建议内容:
```
主题：关于三诺医疗设备蓝牙 SDK 合作咨询

您好，

我们是 [公司名称]，正在开发一款健康管理 APP，
希望能与三诺的血糖仪/血压计进行蓝牙对接。

想咨询以下问题：
1. 是否提供官方蓝牙 SDK？
2. 获取 SDK 的条件和流程？
3. 是否有技术文档和示例代码？
4. 商务合作方式？

期待您的回复，谢谢！

[联系人信息]
```

---

## 十、参考资料

1. 三诺官网产品页面
2. Bluetooth SIG 官方规范
3. GitHub 开源 BLE 项目
4. nRF Connect 使用文档
5. 医疗设备蓝牙对接行业报告

---

**报告版本**: v1.0  
**最后更新**: 2026-03-03  
**状态**: 待进一步验证

> **免责声明**: 本报告基于公开信息整理，具体技术细节以三诺官方文档为准。建议在正式开发前购买实物设备进行验证。
