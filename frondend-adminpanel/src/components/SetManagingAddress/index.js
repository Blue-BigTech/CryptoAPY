import { Row } from "react-bootstrap"
import {
    Button,
    Form,
    Space,
    Input
} from "antd";

import "./index.scss"

const SetManagingAddress = (props) => {
    const {
        handleSetManagementAddress
    } = props

    const [form] = Form.useForm();

    const onFinish = async (params) => {
        const { treasury } = params;
        handleSetManagementAddress(treasury)
    };

    const onFinishFailed = () => {
    };

    return (
        <div>
            <h5><strong>Set Managing Address(only owner)</strong></h5>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item
                    name="treasury"
                    label="Treasury"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <Input
                        placeholder="0xDa086Aa770B67eF32852098a5Ae7105195EBcA77"
                        className="w-100"
                    />
                </Form.Item>
                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit">
                            Set Managing Address
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </div>
    )
}

export default SetManagingAddress;