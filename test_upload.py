import requests

# Backend endpoint
url = "https://krishivaani-backend.onrender.com/api/analyze"

# Load the test image
with open("leaf.jpg", "rb") as img_file:
    files = {"image": img_file}

    # Send POST request to backend
    response = requests.post(url, files=files)

# Print status and JSON result
print("Status Code:", response.status_code)

try:
    print("Response JSON:")
    print(response.json())
except requests.exceptions.JSONDecodeError:
    print("Response is not JSON:")
    print(response.text)
