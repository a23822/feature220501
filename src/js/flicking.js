import Flicking from "../../node_modules/@egjs/flicking";
import { Arrow } from "../../node_modules/@egjs/flicking-plugins";
import "../../node_modules/@egjs/flicking-plugins/dist/arrow.css";

console.log('asd');
const flicking = new Flicking("#banner-flick", {
  circular: true
});

flicking.addPlugins(new Arrow({
  parentEl: document.body
}));