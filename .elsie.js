/********************************************************************
 *  Copyright 2025 Adobe
 *  All Rights Reserved.
 *
 * NOTICE:  Adobe permits you to use, modify, and distribute this 
 * file in accordance with the terms of the Adobe license agreement 
 * accompanying it. 
 *******************************************************************/

module.exports = {
  name: 'custom-component',
  api: {
    root: './src/api',
    importAliasRoot: '@/custom-component/api',
  },
  components: [
    {
      id: 'Components',
      root: './src/components',
      importAliasRoot: '@/custom-component/components',
      cssPrefix: 'custom-component',
      default: true,
    },
  ],
  containers: {
    root: './src/containers',
    importAliasRoot: '@/custom-component/containers',
  },
  schema: {
    endpoint: process.env.ENDPOINT,
    headers: {}
  }
};
