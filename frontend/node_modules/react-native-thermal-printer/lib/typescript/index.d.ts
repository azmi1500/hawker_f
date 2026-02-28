type BluetoothPrinter = {
    deviceName: string;
    macAddress: string;
};
interface PrinterInterface {
    payload: string;
    autoCut: boolean;
    openCashbox: boolean;
    mmFeedPaper: number;
    printerDpi: number;
    printerWidthMM: number;
    printerNbrCharactersPerLine: number;
}
interface PrintTcpInterface extends PrinterInterface {
    ip: string;
    port: number;
    timeout: number;
}
interface PrintBluetoothInterface extends PrinterInterface {
    macAddress: string;
}
declare const _default: {
    printTcp: (args: Partial<PrintTcpInterface> & Pick<PrinterInterface, "payload">) => Promise<void>;
    printBluetooth: (args: Partial<PrintBluetoothInterface> & Pick<PrinterInterface, "payload">) => Promise<void>;
    defaultConfig: PrintTcpInterface & PrintBluetoothInterface;
    getBluetoothDeviceList: () => Promise<BluetoothPrinter[]>;
};
export default _default;
