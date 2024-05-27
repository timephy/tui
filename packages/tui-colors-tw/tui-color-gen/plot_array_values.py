import plotly.graph_objects as go

# Your data
x = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900]
y = [
    23,
    32,
    41,
    50,
    59,
    69,
    78,
    87,
    96,
    105,
    155,
    168,
    180,
    192,
    205,
    218,
    230,
    242,
    255,
]


# Create a scatter plot
fig = go.Figure(data=go.Scatter(x=x, y=y, mode='markers'))

# Show the plot
fig.show()
