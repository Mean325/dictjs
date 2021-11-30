import { DictItem } from "./dictItem";

interface Dict {
  size: number; // 字典数量
  dicts: DictItem[];
  indirection: number; // 间接???
  _options: Option; // 选项
  _source: Source; // 源数据
  [key: string]: DictItem | DictItem[] | Option | Source | number | Function;
}

interface Option {
  ignoreCase: boolean; // 忽略驼峰,忽略大小写
  freeze: boolean; // 冻结,不可修改数据
  strict: boolean; // 严格模式,数据对比使用严格对比
  input: {
    label: string; // 自定义申明时的字段名label
    value: string; // 自定义申明时的字段名value
  };
  output: {
    label: string; // 自定义选项数据的字段名label
    value: string; // 自定义选项数据的字段名value
  };
  // 此处过滤移至转化为options
  // filter: () => boolean; // 过滤方式
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
class Dict implements Dict {
  constructor(source: Array<string> | Source, options: Option) {
    // 数量
    this.size = 4;
    // 间接
    this.indirection = 1;

    // 获取配置信息
    this._options = options || {};
    this._options.ignoreCase = this._options.ignoreCase || false;
    this._options.freeze = this._options.freeze || false;
    this._options.strict = this._options.strict || false;
    // this._options.filter = this._options.filter || null;
    this._options.input = this._options.input || {
      label: "label",
      value: "value",
    };
    this._options.output = this._options.output || {
      label: "label",
      value: "value",
    };

    this.dicts = [];

    // 如果传入的数据为数组, 转化为源数据
    if (Array.isArray(source)) {
      source = transMapToSource(source);
    }

    const sourceKeys = Object.keys(source);
    // 获取源数据的长度
    this._dictSize = sourceKeys.length;

    for (const key in sourceKeys) {
      guardReservedKeys(key);
      this[key] = new DictItem(key, source[key], {
        ignoreCase: this._options.ignoreCase,
      });
      this.dicts.push(this[key] as DictItem);
    }
    this._source = source;

    // 忽略大小写处理
    // if (this._options.ignoreCase) {
    //   this.getLowerCaseDicts = function () {
    //     var res: DictItem[] = {};
    //     for (var i = 0, len = this.dicts.length; i < len; i++) {
    //       res[this.dicts[i].key.toLowerCase()] = this.dicts[i];
    //     }
    //     return res;
    //   };
    // }

    // if (this._options.name) {
    //   this.name = this._options.name;
    // }

    // 这会使Dict实例无法拓展
    if (this._options.freeze) {
      // this.freezeDicts();
    }
  }

  /**
   * @method 获取对应的子项
   * @param  { DictItem | String | Number } key 获取子项的参数
   * @return { labelValue } 对应的labelValue
   */
  getItem(key: string | number): labelValue | null {
    if (key === null || key === undefined) {
      return null;
    }

    // if (DictItem.isDictItem(key)) {
    //   var foundIndex = indexOf.call(this.dicts, key);
    //   if (foundIndex >= 0) {
    //     return key;
    //   }
    //   return this.get(key.key);
    // } else
    if (isString(key)) {
      let dicts = this;
      if (this._options.ignoreCase) {
        // dicts = this.getLowerCaseDicts();
        // key = key.toLowerCase();
      }

      return this[key] as labelValue;
    } else {
      for (const m in this) {
        // eslint-disable-next-line no-prototype-builtins
        if (this.hasOwnProperty(m)) {
          if ((this[m] as DictItem).value === key) {
            return this[m] as DictItem;
          }
        }
      }

      return null;
    }
  }

  /**
   * @method 获取对应的label
   * @param  { DictItem | String | Number } key 获取label的参数
   * @return { String } 对应的label
   */
  getLabel(key: string | number): String | null {
    var item = this.getItem(key);
    if (item) {
      return item.label;
    }

    return null;
  }

  /**
   * @method 获取对应的value
   * @param  { DictItem | String | Number } key 获取value的参数
   * @return { Number } 对应的value
   */
  get(key: string | number): Number | null {
    var item = this.getItem(key);
    if (item) {
      return item.value;
    }

    return null;
  }

  /**
   * @method 判断是否为默认值
   * @param  { Array } dictItem 数组格式的数据源
   * @return { boolean } 判断结果
   */
  // isDefined(dictItem) {
  //   let condition = (e) => e === dictItem;
  //   if (isString(dictItem) || isNumber(dictItem)) {
  //     condition = (e) => e.is(dictItem);
  //   }
  //   return this.dicts.some(condition);
  // }

  /**
   * @method 以JSON格式输出
   * @return { object } json对象
   */
  toJSON() {
    return this._dictMap;
  }

  /**
   * @method 添加枚举子项
   * @return { object } json对象
   */
  add() {
    // if (map.length) {
    //   var array = map;
    //   map = {};
    //   for (var i = 0; i < array.length; i++) {
    //     var exponent = this._dictSize + i;
    //     map[array[i]] = Math.pow(2, exponent);
    //   }
    //   for (var member in map) {
    //     guardReservedKeys(this._options.name, member);
    //     this[member] = new DictItem(member, map[member], {
    //       ignoreCase: this._options.ignoreCase,
    //     });
    //     this.dicts.push(this[member]);
    //   }
    //   for (var key in this._dictMap) {
    //     map[key] = this._dictMap[key];
    //   }
    //   this._dictSize += map.length;
    //   this._dictMap = map;
    //   if (this._options.freeze) {
    //     this.freezeDicts(); // this will make instances of new Dict non-extensible
    //   }
    // }
  }

  // [Symbol.iterator]() {
  //   let index = 0;
  //   return {
  //     next: () =>
  //       index < this.dicts.length
  //         ? { done: false, value: this.dicts[index++] }
  //         : { done: true },
  //   };
  // }
}

/**
 * @method 转化map为源数据
 * @param  { Array } map 数组格式的数据源
 * @return { Source } 转化后的源数据
 */
const transMapToSource = (map: Array<string>) => {
  const obj = {} as Source;
  map.forEach((el: string, index: number) => {
    obj[el] = {
      label: el,
      value: Math.pow(2, index),
    };
  });
  return obj;
};

// 保留字段
const reservedKeys = Object.freeze([
  "_options",
  "get",
  "getKey",
  "getValue",
  "dicts",
  "_dictMap",
  "toJSON",
  "_dictSize",
]);

// 保护保留字段
function guardReservedKeys(key: string) {
  if (key === "name" || reservedKeys.indexOf(key) >= 0) {
    throw new Error(`Dict key ${key} is a reserved word!`);
  }
}

/**
 * 判断是否为数组
 * @return { boolean } 转化后的源数据
 */
const isType = (type: string, value: any) => typeof value === type;
const isObject = (value: any) => isType("object", value);
const isString = (value: any) => isType("string", value);
const isNumber = (value: any) => isType("number", value);

export default Dict;
