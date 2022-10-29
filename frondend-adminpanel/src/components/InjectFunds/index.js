import { useEffect, useState } from "react";
import { Row } from "react-bootstrap"
import {
    Button,
    Form,
    Space,
    InputNumber,
    Select
} from "antd";

import "./index.scss"

const { Option } = Select;

const InjectFunds = (props) => {
    const {
        handleInjectFunds
    } = props

    const [form] = Form.useForm();

    const onFinish = async (params) => {
        await handleInjectFunds(params.personalAmount, params.apyAmount, params.identifier)
    };

    const onFinishFailed = () => {
    };

    useEffect(() => {
    }, [])

    return (
        <div>
            <h5><strong>Inject Funds(only owner or injector)</strong></h5>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item
                    name="personalAmount"
                    label="$PER"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <InputNumber
                        className="w-100"
                        placeholder="Personal Token Amount"
                        min={0}
                    />
                </Form.Item>
                <Form.Item
                    name="apyAmount"
                    label="$APY"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <InputNumber
                        className="w-100"
                        placeholder="Apy Token Amount"
                        min={0}
                    />
                </Form.Item>
                <Form.Item
                    name="identifier"
                    label="Funding Type"
                    hasFeedback
                    rules={[{ required: true, message: 'Please select funding type!' }]}
                >
                    <Select placeholder="Please select a funding type">
                        <Option value={1}>Reward</Option>
                        <Option value={2}>ICO</Option>
                    </Select>
                </Form.Item>
                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit">
                            Inject Funds
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </div>
    )
}

export default InjectFunds;