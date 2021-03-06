//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import * as fp from '@iml/fp';

export default fp.flow(fp.map(fp.eq), fp.or, fn => (x, y) => fn(y, x));
