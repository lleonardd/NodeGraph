import { SharedGraphManagerData } from './GraphManager';

export class LinkGraphData {
    linked: SharedGraphManagerData
    constructor({ linked }: LinkGraphData) {
        this.linked = linked;
    }
}
