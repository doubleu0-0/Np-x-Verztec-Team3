import boto3
import time
time.sleep(10)
ec2 = boto3.client('ec2')
ssm = boto3.client('ssm')
sns = boto3.client('sns')

INSTANCE_ID = 'i-02675c774f4e79477' # CHANGE WITH YOUR INSTANCE ID
SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:571600844113:CompanyPolicyUpdate' # CHANGE WITH YOUR SNS TOPIC ARN

def wait_for_ssm_ready(instance_id, timeout=300):
    print("Waiting for SSM agent to become ready...")
    for _ in range(timeout // 5):
        response = ssm.describe_instance_information(
            Filters=[{'Key': 'InstanceIds', 'Values': [instance_id]}]
        )
        if response['InstanceInformationList']:
            print("SSM agent is ready.")
            return
        time.sleep(5)
    raise Exception("SSM agent did not become ready within timeout.")


def lambda_handler(event, context):
    sns.publish(
        TopicArn=SNS_TOPIC_ARN,
        Subject='Pipeline Starting',
        Message=f'Running policy update pipeline now on EC2 instance {INSTANCE_ID}...'
    )
    print("SNS: Running pipeline message sent.")
    
    # 1. Start EC2 instance
    ec2.start_instances(InstanceIds=[INSTANCE_ID])
    print("Starting EC2 instance...")

    waiter = ec2.get_waiter('instance_running')
    waiter.wait(InstanceIds=[INSTANCE_ID])
    print("Instance is running.")

    # 2. Wait for SSM to be ready
    wait_for_ssm_ready(INSTANCE_ID)

    # 3. Run PowerShell script via SSM
    response = ssm.send_command(
        InstanceIds=[INSTANCE_ID],
        DocumentName='AWS-RunPowerShellScript',
        Parameters={'commands': [
            '& "C:\\Program Files\\Python311\\python.exe" C:\\temp\\pipeline.py'
        ]}
    )

    command_id = response['Command']['CommandId']
    print(f"SSM Command sent: {command_id}")

    # 4. Wait for command to finish (max 10 min)
    time.sleep(10)
    status = "Unknown"
    for _ in range(60):  # check every 10s
        result = ssm.get_command_invocation(
            CommandId=command_id,
            InstanceId=INSTANCE_ID
        )
        status = result['Status']
        print(f"SSM Command status: {status}")
        if status in ['Success', 'Failed', 'Cancelled', 'TimedOut']:
            break
        time.sleep(10)

    # 5. Stop EC2 instance
    print("Stopping EC2 instance...")
    try:
        stop_response = ec2.stop_instances(InstanceIds=[INSTANCE_ID])
        print(f"Stop response: {stop_response}")
        ec2.get_waiter('instance_stopped').wait(InstanceIds=[INSTANCE_ID])
        print("Confirmed: instance is fully stopped.")
    except Exception as e:
        print(f"Failed to stop instance: {e}")

    # 6. Send SNS notification
    sns.publish(
        TopicArn=SNS_TOPIC_ARN,
        Subject='Pipeline Finished',
        Message=f'EC2 instance {INSTANCE_ID} ran the pipeline and has now been stopped.\nFinal status: {status}'
    )
    print("SNS notification sent.")

    return {
        'statusCode': 200,
        'body': f'Pipeline status: {status}, EC2 stopped, and notification sent.'
    }
