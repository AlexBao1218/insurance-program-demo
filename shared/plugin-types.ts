// ---- plugin:custom_feishu_agent_message_sender_1 ----
// ============================================================
// 插件 custom_feishu_agent_message_sender_1 (custom-feishu-agent) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface CustomFeishuAgentMessageSenderOneInput {
  /** 消息卡片标题 */
  message_title: string;
  /** 发送给AI智能体的对话内容 */
  message_content: string;
  /** 接收回复的用户ID列表 */
  receiver_users?: string[];
  /** 接收回复的群组ID列表 */
  receiver_groups?: string[];
  /** 消息底部操作按钮配置 */
  action_buttons?: string[];
}

/**
 * capabilityClient.load('custom_feishu_agent_message_sender_1').call<CustomFeishuAgentMessageSenderOneOutput>('send_feishu_message', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { success } = result;
 */
export interface CustomFeishuAgentMessageSenderOneOutput {
  /** [object Object] */
  success: boolean;
}
// ---- end:custom_feishu_agent_message_sender_1 ----

// ---- plugin:bitable_data_reader_1 ----
// ============================================================
// 插件 bitable_data_reader_1 (飞书多维表格数据读取) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface BitableDataReaderOneInput {
  /** [object Object] */
  fieldNames?: string[];
  /** [object Object] */
  sort?: {
    fieldName: string;
    desc: boolean;
  }[];
  /** [object Object] */
  filter?: {
    conjunction: string;
    conditions: {
      fieldName: string;
      operator: string;
      value: string[];
    }[];
  };
  /** [object Object] */
  pageToken?: string;
  /** [object Object] */
  pageSize?: number;
}

/**
 * capabilityClient.load('bitable_data_reader_1').call<BitableDataReaderOneOutput>('searchRecords', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { hasMore, pageToken, total, ... } = result;
 */
export interface BitableDataReaderOneOutput {
  /** [object Object] */
  hasMore: boolean;
  /** [object Object] */
  pageToken?: string;
  /** [object Object] */
  total?: number;
  /** [object Object] */
  records: {
    id: string;
    record: {

    };
  }[];
}
// ---- end:bitable_data_reader_1 ----

// ---- plugin:spark_ai_assistant_1 ----
// ============================================================
// 插件 spark_ai_assistant_1 (spark-ai-assistant) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================
// ---- end:spark_ai_assistant_1 ----

// ---- plugin:feishu_bitable_dealers_query_1 ----
// ============================================================
// 插件 feishu_bitable_dealers_query_1 (飞书多维表格经销商列表查询) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface FeishuBitableDealersQueryOneInput {
  /** [object Object] */
  pageToken?: string;
  /** [object Object] */
  pageSize?: number;
  /** [object Object] */
  fieldNames?: string[];
  /** [object Object] */
  sort?: {
    fieldName: string;
    desc: boolean;
  }[];
  /** [object Object] */
  filter?: {
    conditions: {
      fieldName: string;
      operator: string;
      value: string[];
    }[];
    conjunction: string;
  };
}

/**
 * capabilityClient.load('feishu_bitable_dealers_query_1').call<FeishuBitableDealersQueryOneOutput>('searchRecords', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { hasMore, pageToken, total, ... } = result;
 */
export interface FeishuBitableDealersQueryOneOutput {
  /** [object Object] */
  hasMore: boolean;
  /** [object Object] */
  pageToken?: string;
  /** [object Object] */
  total?: number;
  /** [object Object] */
  records: {
    id: string;
    record: {
      '关联年度保单': unknown;
      '关联理赔': unknown;
      '理赔总件数': number;
      'Open理赔件数': number;
      '排序分组': number;
      '英文名': {
        text: string;
      };
      '参保状态说明': unknown;
      '联系方式': unknown;
      '理赔状态串': unknown;
    };
  }[];
}
// ---- end:feishu_bitable_dealers_query_1 ----

// ---- plugin:feishu_bitable_claims_record_reader_1 ----
// ============================================================
// 插件 feishu_bitable_claims_record_reader_1 (读取理赔记录表数据) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface FeishuBitableClaimsRecordReaderOneGetrecordInput {
  /** [object Object] */
  recordID: string;
}

/**
 * capabilityClient.load('feishu_bitable_claims_record_reader_1').call<FeishuBitableClaimsRecordReaderOneGetrecordOutput>('getRecord', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { id, record } = result;
 */
export interface FeishuBitableClaimsRecordReaderOneGetrecordOutput {
  /** [object Object] */
  id: string;
  /** [object Object] */
  record?: {

  };
}

export interface FeishuBitableClaimsRecordReaderOneSearchrecordsInput {
  /** [object Object] */
  pageToken?: string;
  /** [object Object] */
  pageSize?: number;
  /** [object Object] */
  fieldNames?: string[];
  /** [object Object] */
  sort?: {
    fieldName: string;
    desc: boolean;
  }[];
  /** [object Object] */
  filter?: {
    conjunction: string;
    conditions: {
      fieldName: string;
      operator: string;
      value: string[];
    }[];
  };
}

/**
 * capabilityClient.load('feishu_bitable_claims_record_reader_1').call<FeishuBitableClaimsRecordReaderOneSearchrecordsOutput>('searchRecords', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { hasMore, pageToken, total, ... } = result;
 */
export interface FeishuBitableClaimsRecordReaderOneSearchrecordsOutput {
  /** [object Object] */
  hasMore: boolean;
  /** [object Object] */
  pageToken?: string;
  /** [object Object] */
  total?: number;
  /** [object Object] */
  records: {
    id: string;
    record: {

    };
  }[];
}
// ---- end:feishu_bitable_claims_record_reader_1 ----

// ---- plugin:insurance_policy_bitable_reader_1 ----
// ============================================================
// 插件 insurance_policy_bitable_reader_1 (保险保单多维表记录查询) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface InsurancePolicyBitableReaderOneInput {
  /** [object Object] */
  pageToken?: string;
  /** [object Object] */
  pageSize?: number;
  /** [object Object] */
  fieldNames?: string[];
  /** [object Object] */
  sort?: {
    fieldName: string;
    desc: boolean;
  }[];
  /** [object Object] */
  filter?: {
    conditions: {
      fieldName: string;
      operator: string;
      value: string[];
    }[];
    conjunction: string;
  };
}

/**
 * capabilityClient.load('insurance_policy_bitable_reader_1').call<InsurancePolicyBitableReaderOneOutput>('searchRecords', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { records, hasMore, pageToken, ... } = result;
 */
export interface InsurancePolicyBitableReaderOneOutput {
  /** [object Object] */
  records: {
    id: string;
    record: {
      'CAR责任限额原值': unknown;
      'CAR到期日': number;
      'ECI到期原值': unknown;
      'ECI保单号': unknown;
      '备注': unknown;
      '经销商年度': {
        text: string;
      };
      'CAR参保状态': unknown;
      'ECI参保状态': unknown;
      '数据来源': string[];
      '排序分组': unknown;
      '年度': unknown;
      'CAR保险公司|Broker': unknown;
      'CAR责任限额(数字)': unknown;
      '关联经销商': unknown;
      'ECI到期日': number;
      'Scaffolding到期日': number;
      'CAR到期原值': unknown;
      '保单文件Policy Files': {
        name: string;
        size: number;
        tmpUrl: string;
        type: string;
      }[];
      'ECI保险公司|Broker': unknown;
      'Scaffolding到期原值': unknown;
      'CAR保单号': unknown;
    };
  }[];
  /** [object Object] */
  hasMore: boolean;
  /** [object Object] */
  pageToken?: string;
  /** [object Object] */
  total?: number;
}
// ---- end:insurance_policy_bitable_reader_1 ----

// ---- plugin:programme_insurance_class_reader_1 ----
// ============================================================
// 插件 programme_insurance_class_reader_1 (险种表查询) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface InsuranceClassReaderOneInput {
  /** [object Object] */
  sort?: {
    fieldName: string;
    desc?: boolean;
  }[];
  /** [object Object] */
  filter?: {
    conjunction?: string;
    conditions?: {
      fieldName: string;
      operator: string;
      value?: string[];
    }[];
  };
  /** [object Object] */
  pageToken?: string;
  /** [object Object] */
  pageSize?: number;
  /** [object Object] */
  fieldNames?: string[];
}

/**
 * capabilityClient.load('programme_insurance_class_reader_1').call<InsuranceClassReaderOneOutput>('searchRecords', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { hasMore, pageToken, total, ... } = result;
 * 返回值形如：
 *   {"hasMore":false,"pageToken":"示例文本","total":0,"records":[{"record":{"Full_Name":null,"Broker":"示例文本","Remarks":null,"Class_Code":{},"Is_Core":null,"Has_Claims_Ledger":null,"Claims_Count_Rollup":null,"Item_No":0,"Currency":"示例文本","Class_Level":"示例文本","Premium_Current_Year":{},"Is_Summary_Only":null,"Open_Claims_Rollup":null,"Total_Incurred_Rollup":null,"Premium_Manual":0,"Insurer":null},"id":"示例文本"}]}
 */
export interface InsuranceClassReaderOneOutput {
  /** [object Object] */
  hasMore: boolean;
  /** [object Object] */
  pageToken?: string;
  /** [object Object] */
  total?: number;
  /** [object Object] */
  records: {
    record: {
      Full_Name?: unknown;
      Broker?: string;
      Remarks?: unknown;
      Class_Code?: {
        text: string;
      };
      Is_Core?: unknown;
      Has_Claims_Ledger?: unknown;
      Claims_Count_Rollup?: unknown;
      Item_No?: number;
      Currency?: string;
      Class_Level?: string;
      Premium_Current_Year?: {
        bizType: string;
        value?: unknown;
      };
      Is_Summary_Only?: unknown;
      Open_Claims_Rollup?: unknown;
      Total_Incurred_Rollup?: unknown;
      Premium_Manual?: number;
      Insurer?: unknown;
    };
    id: string;
  }[];
}
// ---- end:programme_insurance_class_reader_1 ----