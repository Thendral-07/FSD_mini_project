import NodeCache from "node-cache";

// StdTTL: 1 hour (3600 seconds) by default
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

export default cache;
