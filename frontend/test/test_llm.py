from langchain_community.llms import Ollama

def get_llm(model_name: str):
    remote_base_url = "http://localhost:11500"
    if model_name == "llama3.2":
        return Ollama(model="llama3.2", base_url=remote_base_url)

if __name__ == "__main__":
    llm = get_llm("llama3.2")
    output = llm("What is the speed of light?")
    print("Response:", output)
