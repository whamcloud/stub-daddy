//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import config from '../config';

export default entries => ({
  statusCode: config.get('status').SUCCESS,
  data: entries,
  headers: config.get('standardHeaders')
});
