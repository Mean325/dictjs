interface DictItem {
  key: string;
  label: string;
  value: number;
}

interface Source {
  [key: string]: labelValue;
}

interface labelValue {
  label: string;
  value: number;
}

/**
 * 带有子项的枚举
 * @param { Array || Object }  source 枚举数据
 * @param { Object } options 配置
 */
class DictItem implements DictItem {
  constructor(key: string, source: labelValue, options: any) {
    this.key = key;
    this.label = source.label;
    this.value = source.value;
  }
  /**
   * Returns JSON object representation of this Dict.
   * @return {String} JSON object representation of this Dict.
   */
  toJSON() {
    return this.key;
  }

  isDictItem() {
    return false;
  }
}

export { DictItem };
