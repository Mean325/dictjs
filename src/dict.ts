import { DictItem } from "./dictItem";

interface Dict {
  dicts: object;
  _size: number; // 字典数量
  // dicts: DictItem[];
  _options: Option; // 字典配置信息
  _source: Source | object; // 源数据
  _sourceOptions: Source; // 源数据选项模式
  _sourceSize: number; // 源数据长度
  getLowerCaseDicts: Function;
  [key: string]: DictItem | DictItem[] | Option | Source | number | string | object | Function;
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
  constructor(source: Source | object, options: Option) {
    // TODO: 数量
    this._size = 4;

    // 获取配置信息
    this._options = options || {};
    this._options.ignoreCase = this._options.ignoreCase || false;
    this._options.freeze = this._options.freeze || true;
    this._options.strict = this._options.strict || true;
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

    // 保存声明时的数据
    this._source = source;
    // 如果传入的数据为对象, 转化为选项
    if (isObject(source)) {
      source = transMapToOptions(source);
    }

    // 获取源数据的长度
    this._sourceSize = (source as Source).length;

    // 此处item为labelValue
    for (let item of source as Source) {
      const { label, value } = item;
      if (isString(value)) {
        // 判断是否为保护字段
        // @ts-ignore
        judgeReservedKeys(value);
      }
      // 判断当前value是否重复
      judgeRepeatValue(value, this.dicts);

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
    // this._sourceOptions = source;
    // 保存声明时的转为对象后的数据
    // this._sourceObj = source;

    // 忽略大小写处理
    if (this._options.ignoreCase) {
      // 获取转为小写的字典数组
      // TODO: 大小写忽略方法
      this.getLowerCaseDicts = function () {
        const res: LabelValue[] = [];
        // for (let i = 0, len = this.dicts.length; i < len; i++) {
        //   const { label, value } = this.dicts[i];
        //   res.push({
        //     label: label.toLowerCase(),
        //     // 此处必为string类型
        //     // @ts-ignore
        //     value: isString(value) ? value.toLowerCase() : value
        //   })
        // }
        return res;
      };
    }

    // 冻结Dict实例后, 新增删除等方法将不生效
    if (this._options.freeze) {
      this.freezeDicts();
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
        dicts = this.getLowerCaseDicts();
        // 此处必为string类型
        // @ts-ignore
        key = key.toLowerCase();
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
   * @method 冻结字典
   * @param  { Array } dictItem 数组格式的数据源
   * @return { boolean } 判断结果
   */
  freezeDicts() {
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

    deepFreeze(this);

    return this;
  }

  /**
   * @method 判断是否为默认值
   * @param  { Array } dictItem 数组格式的数据源
   * @return { boolean } 判断结果
   */
  definedHas(dictItem: number | string) {
    return !!this._sourceOptions.find((i: LabelValue) => i.label === dictItem || i.value === dictItem);
  }

  /**
   * @method 以JSON格式输出
   * @return { object } json对象
   */
  toJSON() {
    return this._dictMap;
  }

  /**
   * @method 以JSON字符串格式输出
   * @return { string } json字符串
   */
  toString() {
    return JSON.stringify(this._dictMap);
  }

  /**
   * @method 获取声明时的数据
   * @return { string } json字符串
   */
  getSource() {
    return this._source;
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
  "_options",
  "get",
  "getKey",
  "getValue",
  "dicts",
  "_dictMap",
  "toJSON",
  "_dictSize",
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
 * 工具函数合集
 */
const isType = (type: string, value: any) => typeof value === type;
const isObject = (value: any) => isType("object", value);
const isString = (value: any) => isType("string", value);
const isNumber = (value: any) => isType("number", value);

export default Dict;
