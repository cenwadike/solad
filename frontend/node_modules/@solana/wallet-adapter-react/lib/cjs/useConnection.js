"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionContext = void 0;
exports.useConnection = useConnection;
const react_1 = require("react");
exports.ConnectionContext = (0, react_1.createContext)({});
function useConnection() {
    return (0, react_1.useContext)(exports.ConnectionContext);
}
//# sourceMappingURL=useConnection.js.map