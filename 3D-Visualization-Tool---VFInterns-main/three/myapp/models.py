from django.db import models

# Represents the Floor entity in the database
class Floor(models.Model):
    name = models.CharField(max_length=50)  # Name of the floor, max length of 50 characters
    width = models.FloatField()             # Width of the floor in some unit (e.g., meters)
    length = models.FloatField()            # Length of the floor in some unit (e.g., meters)
    color = models.CharField(max_length=20) # Color of the floor, stored as a string
    gridx = models.FloatField()             # X-axis grid spacing for the floor
    gridy = models.FloatField()             # Y-axis grid spacing for the floor
    site_name = models.CharField(max_length=50) # Name of the site where the floor is located

    # String representation of the Floor object
    def __str__(self):
        return f"Floor {self.id} - {self.site_name} - {self.name}"


# Represents different figures that can be placed on a floor
class Figure(models.Model):
    # Choices for the type of figure model, defined as a list of tuples
    MODEL_NAME_CHOICES = [
        ('cooler', 'Cooler'),
        ('electrical_panel', 'Electrical Panel'),
        ('perforated_tile', 'Perforated Tile'),
        ('rack', 'Rack'),
        ('raised_floor', 'Raised Floor'),
    ]
    
    floor = models.ForeignKey(Floor, related_name='figures', on_delete=models.CASCADE) 
    # Foreign key linking each figure to a specific floor. When a floor is deleted, all associated figures are also deleted.

    x_position = models.FloatField()        # X-axis position of the figure on the floor
    y_position = models.FloatField()        # Y-axis position of the figure on the floor
    height = models.FloatField()            # Height of the figure
    width = models.FloatField()             # Width of the figure
    depth = models.FloatField()             # Depth of the figure
    figure_type = models.CharField(max_length=50)  # Type or category of the figure (e.g., electrical, cooling)
    color = models.CharField(max_length=20) # Color of the figure, stored as a string
    angle = models.FloatField()             # Rotation angle of the figure (in degrees)
    figure_name = models.CharField(max_length=20, choices=MODEL_NAME_CHOICES) 
    # Name of the figure, restricted to a predefined set of choices
    
    rack_id = models.IntegerField()         # Identifier for the rack associated with the figure (if applicable)

    # String representation of the Figure object
    def __str__(self):
        return f"Figure {self.id} - {self.floor} - {self.figure_type} - {self.figure_name}"
