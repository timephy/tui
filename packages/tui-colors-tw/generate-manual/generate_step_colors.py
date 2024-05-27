import numpy as np

N = 10 + 9

steps = np.rint(np.linspace(0, 900, N))
light_values = np.linspace(255, 23, N)
dark_values = np.linspace(23, 255, N)

print(light_values)

# light = []
dark = []
for i in range(N-1):
    dark.append(dark_values[i])
    dark.append(dark_values[i] + 10)
dark.append(dark_values[N-1])

# print(light)
print(dark)

# light = np.rint(np.array(light))
dark = np.rint(np.array(dark))


print(steps)
# print(light)
print(dark)

# ! Linear
# !! Light
# 255
# 242
# 229
# 216
# 203
# 191
# 178
# 165
# 152
# 139
# 126
# 113
# 100
#  87
#  75
#  62
#  49
#  36
#  23
# !! Dark
#  23
#  36
#  49
#  62
#  75
#  87
# 100
# 113
# 126
# 139
# 152
# 165
# 178
# 191
# 203
# 216
# 229
# 242
# 255

# ! Linear but 50s are x1.2
# !! Dark
#  23
#  28
#  49
#  59
#  75
#  89
# 100
# 120
# 126
# 151
# 152
# 182
# 178
# 213
# 203
# 244
# 229
# 275
# 255
# 306
# 255


# ! Linear but 50s are +10
# !! Dark
#  23
#  33
#  49
#  59
#  75
#  85
# 100
# 110
# 126
# 136
# 152
# 162
# 178
# 188
# 203
# 213
# 229
# 239
# 255
