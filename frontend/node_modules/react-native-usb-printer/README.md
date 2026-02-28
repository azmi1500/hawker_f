# react-native-usb-printer

A React Native Library to support USB printer for Android platform 

## Installation

```
npm install react-native-usb-printer --save
```

## Integrate module

To integrate `react-native-usb-printer` with the rest of your react app just execute:
```
react-native link react-native-usb-printer
```

## Usage

```javascript
import { RNUSBPrinter } from 'react-native-usb-printer';

RNUSBPrinter.printText('这是一个测试打印')
RNUSBPrinter.printBillTextWithCut("<C>这是一段打印测试文字</C>")
RNUSBPrinter.printBillTextWithCut("<M>这是一段打印测试文字</M>")
RNUSBPrinter.printBillTextWithCut("<CM>这是一段打印测试文字</CM>")

```

## Example

```javascript

  componentDidMount = async () => {
    var devices = await RNUSBPrinter.getUSBDeviceList();
    vendorID = 1155
    productId = 22304
    let printedSelected = await RNUSBPrinter.connectPrinter(vendorId, productId);
    this.setState(Object.assign({}, this.state, {
        printedSelected: printedSelected,
        devices: devices,
      }));
  }

  printTest = () => {
    if(this.state.printedSelected) {
      RNUSBPrinter.printText("<C>这是一段打印测试文字</C>\n");
    }else{
      console.log("没有找到打印设备")
    }
    
  }

  printRawDataTest = () => {
    if(this.state.printedSelected) {
      RNUSBPrinter.printBillTextWithCut("<C>这是一段打印测试文字</C>");
    }else{
      console.log("没有找到打印设备")
    }
  }

  ...

  render() {
    return (
      <View style={styles.container}>
        {
          this.state.deviceList.map(device => (
            <Text key={device.device_id}>
              {`device_name: ${device.device_name}, device_id: ${device.device_id}, vendor_id: ${device.vendor_id}, product_id: ${device.product_id}`}
            </Text>
            ))
        }
        <TouchableOpacity onPress={() => this.printTest()}>
          <Text> Print Text </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => this.printRawDataTest()}>
          <Text> Print Bill Text </Text>
        </TouchableOpacity>
      </View>
    )
  }
  ...

```
