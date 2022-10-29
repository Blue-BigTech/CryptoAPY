import { Row } from "react-bootstrap"
import {
    Button,
    Form,
    Space,
    Input
} from "antd";

import "./index.scss"

const SetWhitelistMerkleRoot = (props) => {
    const {
        handleSetWhitelistMerkleRoot,
        handleStartIco
    } = props

    const [form] = Form.useForm();

    const onFinish = async (params) => {
        const { merkleRoot } = params;
        handleSetWhitelistMerkleRoot(merkleRoot)
    };

    const onFinishFailed = () => {
    };

    return (
        <div>
            <h5><strong>Set Whitelist Merkle Root</strong></h5>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item
                    name="merkleRoot"
                    label="Whitelist Merkle Root"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <Input
                        placeholder="0x62b3350ae99b9a77169e5dde2a30013fa5d0ffb45706e94f98d1729edbeed433"
                        className="w-100"
                    />
                </Form.Item>
                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit">
                            Set Merkle Root
                        </Button>

                        <Button type="primary" onClick={handleStartIco}>
                            Start ICO
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </div>
    )
}

export default SetWhitelistMerkleRoot;