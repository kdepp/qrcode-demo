export const partial = (fn) => {
    let len = fn.length,
        arbitary;

        arbitary = (cur_args, left_arg_cnt) => (...args) => {
            if (args.length >= left_arg_cnt) {
                return fn.apply(null, cur_args.concat(args));
            }

            return arbitary(cur_args.concat(args), left_arg_cnt - args.length);
        };

    return arbitary([], len);
};

export const reduceRight = (fn, initial, list) => {
    var ret = initial;

    for (let i = list.length - 1; i >= 0; i --) {
        ret = fn(list[i], ret);
    }

    return ret;
};

export const compose = (...args) => {
    return reduceRight((cur, prev) => {
        return x => cur(prev(x));
    }, (x => x), args);
};

export const map = partial((fn, list) => {
    var result = [];

    for (let i = 0, len = list.length; i < len; i ++) {
        result.push(fn(list[i]));
    }

    return result;
});

export const on = partial((key, fn, dict) => {
    return {
        ...dict,
        [key]: fn(dict[key])
    };
});


export function pick(keys, obj) {
  return keys.reduce(function (prev, cur) {
    prev[cur] = obj[cur];
    return prev;
  }, {});
}

export function range(start, end, step = 1) {
  var ret = [];

  for (var i = start; i < end; i += step) {
    ret.push(i);
  }

  return ret;
}
