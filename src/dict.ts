import { DictItem } from "./dictItem";

interface Dict {
  dicts: object;
  _options: Option; // 字典配置信息
  _size: number; // 字典数量
  __SOURCE__: {
    data: Source | object; // 初始化数据
    dicts: object; // 源数据字典模式
    options: Source; // 源数据选项模式
    size: number; // 源数据长度
  }; // 源数据
  [key: string]: | Option | Source | number | string | object | Function;
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

type Source = LabelValue[];

interface LabelValue {
  label: string;
  value: number | string;
}

/**
 * 带有子项的字典
 * @param { Array || Object }  source 字典数据
 * @param { Object } options 配置
 */
class Dict implements Dict {
  constructor(data: Source | object, options: Option) {
    // 获取配置信息
    const {
      ignoreCase = false,
      freeze = true,
      strict = true,
      input = {
        label: "label",
        value: "value",
      },
      output = {
        label: "label",
        value: "value",
      },
    } = options || {};
    this._options = { ignoreCase, freeze, strict, input, output };

    this.dicts = [];
    // @ts-ignore
    this.__SOURCE__ = {};

    // 保存声明时的数据
    this.__SOURCE__.data = data;
    // TODO: 此处需要根据input取相应的值
    // 如果传入的数据为对象, 转化为选项
    const source = isObject(data) ? transMapToOptions(data) : data as Source;

    this.__SOURCE__.options = source;
    this.__SOURCE__.size = source.length;
    this._size = source.length;

    // 此处item为labelValue
    for (let item of source) {
      let { label, value } = item;
      if (isString(value)) {
        // 判断是否为保护字段
        // @ts-ignore
        judgeReservedKeys(value);
      }
      // 判断当前value是否重复
      judgeRepeatValue(value, this.dicts);

      // 忽略大小写处理
      if (this._options.ignoreCase) {
        value = toLowerCase(value)
      }

      // 将value: label赋值到this, 使Dict[value]能直接取到label
      // TODO: 此处未考虑value重复的情况
      // TODO: 此处number作为key时和string无法区分
      this[value] = item;
      // @ts-ignore
      this.dicts[value] = label;
      // this[key] = new DictItem(key, source[key], {
      //   ignoreCase: this._options.ignoreCase,
      // });
      // this.dicts.push(this[item.value] as DictItem);
    }
    // 保存声明时的转为选项后的数据
    this.__SOURCE__.dicts = (this.dicts);

    // 忽略大小写处理
    // if (this._options.ignoreCase) {
    //   // 获取转为小写的字典数组
    //   // TODO: 大小写忽略方法
    //   this.getLowerCaseDicts = function () {
        // const res: LabelValue[] = [];
        // for (let i = 0, len = this.dicts.length; i < len; i++) {
        //   const { label, value } = this.dicts[i];
        //   res.push({
        //     label: label.toLowerCase(),
        //     // 此处必为string类型
        //     // @ts-ignore
        //     value: isString(value) ? value.toLowerCase() : value
        //   })
        // }
        // return res;
    //   };
    // }

    // 冻结Dict实例后, 新增删除等方法将不生效
    if (this._options.freeze) {
      deepFreeze(this);
    }
  }

  /**
   * @method 获取对应的子项
   * @param  { DictItem | String | Number } key 获取子项的参数
   * @return { LabelValue } 对应的LabelValue
   */
  getItem(key: string | number): LabelValue | null {
    if (key === null || key === undefined) {
      return null;
    }

    // if (DictItem.isDictItem(key)) {
    //   const foundIndex = indexOf.call(this.dicts, key);
    //   if (foundIndex >= 0) {
    //     return key;
    //   }
    //   return this.get(key.key);
    // } else
    if (isString(key)) {
      let dicts = this;
      if (this._options.ignoreCase) {
        // dicts = this.getLowerCaseDicts();
        // 此处必为string类型
        // @ts-ignore
        key = toLowerCase(key);
      }

      return this[key] as LabelValue;
    } else {
      // 遍历查找
      for (const m in this) {
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
    const item = this.getItem(key);
    if (item) {
      return item.label;
    }

    return null;
  }

  /**
   * @method 获取当前值的序号
   * @param  { DictItem | String | Number } key 获取label的参数
   * @return { String } 对应的label
   */
  getIndex(key: string | number): number {
    // TODO
    return -1;
  }

  /**
   * @method 获取对应的value
   * @param  { DictItem | String | Number } key 获取value的参数
   * @return { Number } 对应的value
   */
  get(key: string | number): string | number | null {
    const item = this.getItem(key);
    if (item) {
      return item.value;
    }

    return null;
  }

  /**
   * @method 获取option格式数据
   * @param  { number[] | string[] | Function } filter 数组格式的数据源
   * @param  { number[] | string[] | Function } sort 数组格式的数据源
   * @return { Source } 选项格式数据
   */
  getOptions(filter: number[] | string[] | Function, sort: number[] | string[] | Function) {
    // TODO: 此处需要根据output取相应的值
    // TODO
    return this._options;
  }

  /**
   * @method 获取option格式数据
   * @return { Source } 字典格式数据
   */
  getDicts() {
    return this.dicts;
  }

  /**
   * @method 判断是否为默认值
   * @param  { Array } key 数组格式的数据源
   * @return { boolean } 判断结果
   */
  has(key: number | string) {
    // @ts-ignore
    return !!this.dicts[key];
  }

  /**
   * @method 判断是否为默认值
   * @param  { Array } dictItem 数组格式的数据源
   * @return { boolean } 判断结果
   */
  definedHas(dictItem: number | string) {
    return !!this.__SOURCE__.options.find((i: LabelValue) => i.label === dictItem || i.value === dictItem);
  }

  /**
   * @method 以JSON格式输出
   * @return { object } json对象
   */
  toJSON() {
    return this.dicts;
  }

  /**
   * @method 以JSON字符串格式输出
   * @return { string } json字符串
   */
  toString() {
    return JSON.stringify(this.dicts);
  }

  /**
   * @method 获取声明时的数据
   * @return { string } json字符串
   */
  getSource() {
    return this.__SOURCE__.data;
  }

  /**
   * @method 添加字典子项
   */
  set(label: string, value: string | number) {
    if (this._options.freeze) {
      throw new Error(`字典声明时为一个冻结对象, 如需要请修改声明时的options.`);
    }
    judgeReservedKeys(value as string);
    // 判断当前value是否重复
    judgeRepeatValue(value, this.dicts);
    this[value] = {
      label,
      value
    };
    // @ts-ignore
    this.dicts[value] = label;
    this._size += this._size;
  }

  /**
   * @method 删除字典子项
   */
  delete(value: string | number) {
    if (this._options.freeze) {
      throw new Error(`字典声明时为一个冻结对象, 如需要请修改声明时的options.`);
    }
    // @ts-ignore
    delete this.dicts[value];
    delete this[value];
    this._size -= this._size;
  }
}

/**
 * @method 转化map为源数据
 * @param  { object } map map格式的数据源
 * @return { Source } 转化后的选项格式
 */
const transMapToOptions = (map: object): LabelValue[] => {
  return Object.entries(map).reduce((prev: LabelValue[], curr: any[]) => {
    prev.push({
      label: curr[1],
      value: curr[0],
    });
    return prev;
  }, []);
};

// 保留字段
const reservedKeys = Object.freeze([
  "dicts",
  "_options",
  "_size",
  "__SOURCE__",

  "getItem",
  "getLabel",
  "get",
  "definedHas",
  "toJSON",
  "toString",
  "getSource",
  "set",
  "delete",
]);

// 判断是否为保留字段
function judgeReservedKeys(key: string) {
  if (reservedKeys.indexOf(key) >= 0) {
    throw new Error(`字典值 ${key} 是一个保留字段.`);
  }
}

// 判断是否为重复值
function judgeRepeatValue(value: any, dicts: object) {
  // @ts-ignore
  if (Object.keys(dicts).findIndex((i: LabelValue) => i === value) >= 0) {
    throw new Error(`字典值 ${value} 和其他值重复.`);
  }
}

/**
 * @method 递归冻结
 * @param  { object } o 需要冻结的对象
 */
function deepFreeze(o: object) {
  Object.freeze(o);
  for (const propKey in o) {
    // @ts-ignore
    const prop = o[propKey];
    if (!o.hasOwnProperty(propKey) || !(typeof prop === "object") || Object.isFrozen(prop)) {
      // 跳过原型链上的属性、基本类型和已冻结的对象.
      continue;
    }
    deepFreeze(prop) //递归调用
  }
}

// 将value转为小写
function toLowerCase(value: number | string): string {
  if (isNumber(value)) value = value.toString();
  return (value as string).toLowerCase();
}

/**
 * 工具函数合集
 */
const isType = (type: string, value: any) => typeof value === type;
const isObject = (value: any) => isType("object", value);
const isString = (value: any) => isType("string", value);
const isNumber = (value: any) => isType("number", value);

export default Dict;
