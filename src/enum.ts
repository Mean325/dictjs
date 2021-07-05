import { EnumItem } from "./enumItem";

interface Enum {
  size: number; // 大小???
  indirection: number; // 间接
  enums: EnumItem[];
  _enumSize: number; // 枚举个数
  _options: Option; // 选项
  _source: Source; // 源数据
  [key: string]: EnumItem | EnumItem[] | Option | Source | number | Function;
}

interface Option {
  ignoreCase: boolean; // 忽略驼峰,忽略大小写
  freeze: boolean; // 冻结,不可修改数据
  strict: boolean; // 严格模式,数据对比使用严格对比
  filter: () => boolean; // 过滤方式
  input: {
    label: string; // 自定义申明时的字段名label
    value: string; // 自定义申明时的字段名value
  };
  output: {
    label: string; // 自定义选项数据的字段名label
    value: string; // 自定义选项数据的字段名value
  };
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
class Enum implements Enum {
  constructor(source: Array<string> | Source, options: Option) {
    this.size = 4;
    this.indirection = 1;

    // 获取配置信息
    this._options = options || {};
    this._options.ignoreCase = this._options.ignoreCase || false;
    this._options.freeze = this._options.freeze || false;
    this._options.strict = this._options.strict || false;
    this._options.filter = this._options.filter || null;
    this._options.input = this._options.input || {
      label: "label",
      value: "value",
    };
    this._options.output = this._options.output || {
      label: "label",
      value: "value",
    };

    this.enums = [];

    // 如果传入的数据为数组, 转化为源数据
    if (Array.isArray(source)) {
      source = transMapToSource(source);
    }

    const sourceKeys = Object.keys(source);
    // 获取源数据的长度
    this._enumSize = sourceKeys.length;

    for (const key in sourceKeys) {
      guardReservedKeys(key);
      this[key] = new EnumItem(key, source[key], {
        ignoreCase: this._options.ignoreCase,
      });
      this.enums.push(this[key] as EnumItem);
    }
    this._source = source;

    // 忽略大小写处理
    // if (this._options.ignoreCase) {
    //   this.getLowerCaseEnums = function () {
    //     var res: EnumItem[] = {};
    //     for (var i = 0, len = this.enums.length; i < len; i++) {
    //       res[this.enums[i].key.toLowerCase()] = this.enums[i];
    //     }
    //     return res;
    //   };
    // }

    // if (this._options.name) {
    //   this.name = this._options.name;
    // }

    // 这会使Enum实例无法拓展
    if (this._options.freeze) {
      // this.freezeEnums();
    }
  }

  /**
   * @method 获取对应的子项
   * @param  { EnumItem | String | Number } key 获取子项的参数
   * @return { labelValue } 对应的labelValue
   */
  getItem(key: string | number): labelValue | null {
    if (key === null || key === undefined) {
      return null;
    }

    // if (EnumItem.isEnumItem(key)) {
    //   var foundIndex = indexOf.call(this.enums, key);
    //   if (foundIndex >= 0) {
    //     return key;
    //   }
    //   return this.get(key.key);
    // } else
    if (isString(key)) {
      var enums = this;
      if (this._options.ignoreCase) {
        // enums = this.getLowerCaseEnums();
        // key = key.toLowerCase();
      }

      return this[key] as labelValue;
    } else {
      for (var m in this) {
        // eslint-disable-next-line no-prototype-builtins
        if (this.hasOwnProperty(m)) {
          if ((this[m] as EnumItem).value === key) {
            return this[m] as EnumItem;
          }
        }
      }

      return null;
    }
  }

  /**
   * @method 获取对应的label
   * @param  { EnumItem | String | Number } key 获取label的参数
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
   * @param  { EnumItem | String | Number } key 获取value的参数
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
   * @method 冻结枚举
   * @param  { Array } enumItem 数组格式的数据源
   * @return { boolean } 判断结果
   */
  // freezeEnums() {
  //   function envSupportsFreezing() {
  //     return (
  //       Object.isFrozen &&
  //       Object.isSealed &&
  //       Object.getOwnPropertyNames &&
  //       Object.getOwnPropertyDescriptor &&
  //       Object.defineProperties &&
  //       Object.__defineGetter__ &&
  //       Object.__defineSetter__
  //     );
  //   }

  //   function freezer(o) {
  //     var props = Object.getOwnPropertyNames(o);
  //     props.forEach(function (p) {
  //       if (!Object.getOwnPropertyDescriptor(o, p).configurable) {
  //         return;
  //       }

  //       Object.defineProperties(o, p, { writable: false, configurable: false });
  //     });
  //     return o;
  //   }

  //   function getPropertyValue(value) {
  //     return value;
  //   }

  //   function deepFreezeEnums(o) {
  //     if (
  //       typeof o !== "object" ||
  //       o === null ||
  //       Object.isFrozen(o) ||
  //       Object.isSealed(o)
  //     ) {
  //       return;
  //     }
  //     for (var key in o) {
  //       // eslint-disable-next-line no-prototype-builtins
  //       if (o.hasOwnProperty(key)) {
  //         o.__defineGetter__(key, getPropertyValue.bind(null, o[key]));
  //         o.__defineSetter__(key, function throwPropertySetError(value) {
  //           throw TypeError(
  //             "Cannot redefine property; Enum Type is not extensible."
  //           );
  //         });
  //         deepFreezeEnums(o[key]);
  //       }
  //     }
  //     if (Object.freeze) {
  //       Object.freeze(o);
  //     } else {
  //       freezer(o);
  //     }
  //   }

  //   if (envSupportsFreezing()) {
  //     deepFreezeEnums(this);
  //   }

  //   return this;
  // }

  /**
   * @method 判断是否为默认值
   * @param  { Array } enumItem 数组格式的数据源
   * @return { boolean } 判断结果
   */
  // isDefined(enumItem) {
  //   let condition = (e) => e === enumItem;
  //   if (isString(enumItem) || isNumber(enumItem)) {
  //     condition = (e) => e.is(enumItem);
  //   }
  //   return this.enums.some(condition);
  // }

  /**
   * @method 以JSON格式输出
   * @return { object } json对象
   */
  toJSON() {
    return this._enumMap;
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
    //     var exponent = this._enumSize + i;
    //     map[array[i]] = Math.pow(2, exponent);
    //   }
    //   for (var member in map) {
    //     guardReservedKeys(this._options.name, member);
    //     this[member] = new EnumItem(member, map[member], {
    //       ignoreCase: this._options.ignoreCase,
    //     });
    //     this.enums.push(this[member]);
    //   }
    //   for (var key in this._enumMap) {
    //     map[key] = this._enumMap[key];
    //   }
    //   this._enumSize += map.length;
    //   this._enumMap = map;
    //   if (this._options.freeze) {
    //     this.freezeEnums(); // this will make instances of new Enum non-extensible
    //   }
    // }
  }

  [Symbol.iterator]() {
    let index = 0;
    return {
      next: () =>
        index < this.enums.length
          ? { done: false, value: this.enums[index++] }
          : { done: true },
    };
  }
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

var reservedKeys = [
  "_options",
  "get",
  "getKey",
  "getValue",
  "enums",
  "_enumMap",
  "toJSON",
  "_enumSize",
];

function guardReservedKeys(key: string) {
  if (key === "name" || reservedKeys.indexOf(key) >= 0) {
    throw new Error(`Enum key ${key} is a reserved word!`);
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

export default Enum;
